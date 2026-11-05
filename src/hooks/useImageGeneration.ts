import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import type {
  ProviderConfig,
  ReferenceImage,
  LibraryItem,
  GenerationJob,
  GenerationSnapshot,
  QualityTier,
  SizeTier,
  OutputFormat,
} from '@/types/image'
import { createId, normalizeProvider } from '@/lib/image-db'
import { getSize, requestImage, imageUrlToDataUrl } from '@/lib/api'
import { toast } from 'sonner'

export interface StartGenerationParams {
  provider: ProviderConfig
  prompt: string
  quality: QualityTier
  outputFormat: OutputFormat
  sizeTier: SizeTier
  aspectRatio: string
  batchCount: number
  parallelCount: number
  references: ReferenceImage[]
  onOpenProviderDialog: () => void
  onJobSuccess: (item: LibraryItem) => void
}

export function useImageGeneration() {
  const [jobs, setJobs] = useState<GenerationJob[]>([])
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [, setTick] = useState<number>(0)

  const runningControllersRef = useRef<Map<string, AbortController>>(new Map())
  const cancelledBatchIdsRef = useRef<Set<string>>(new Set())
  const timerTickRef = useRef<number>(0)

  // Synchronize queue timer for active running jobs
  useEffect(() => {
    const hasRunning = jobs.some((j) => j.status === 'running')
    if (!hasRunning) return

    const interval = window.setInterval(() => {
      timerTickRef.current += 1
      setTick(timerTickRef.current)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [jobs])

  // Focused Batch and Stats
  const focusedBatchId = activeBatchId || jobs[0]?.batchId || null

  const batchJobs = useMemo(() => {
    if (!focusedBatchId) return []
    return jobs.filter((j) => j.batchId === focusedBatchId)
  }, [jobs, focusedBatchId])

  const batchStats = useMemo(() => {
    const total = batchJobs.length
    const running = batchJobs.filter((j) => j.status === 'running').length
    const success = batchJobs.filter((j) => j.status === 'success').length
    const error = batchJobs.filter((j) => j.status === 'error' || j.status === 'cancelled').length
    const finished = success + error
    const queued = batchJobs.filter((j) => j.status === 'queued').length
    return { total, running, success, error, finished, queued }
  }, [batchJobs])

  // Stop Active Batch
  const stopActiveBatch = useCallback(() => {
    if (!activeBatchId) return
    cancelledBatchIdsRef.current.add(activeBatchId)

    setJobs((prev) =>
      prev.map((j) => {
        if (j.batchId !== activeBatchId) return j
        if (j.status === 'queued') {
          return {
            ...j,
            status: 'cancelled',
            completedAt: new Date().toISOString(),
            error: '任务已停止。',
            responseStatus: 'cancelled',
            responseMessage: '任务未开始，已停止',
          }
        }
        if (j.status === 'running') {
          const controller = runningControllersRef.current.get(j.id)
          if (controller) controller.abort()
        }
        return j
      })
    )

    toast.info('当前批次已停止')
  }, [activeBatchId])

  // Start Batch Generation
  const startBatchGeneration = useCallback(
    async ({
      provider: rawProvider,
      prompt,
      quality,
      outputFormat,
      sizeTier,
      aspectRatio,
      batchCount,
      parallelCount,
      references,
      onOpenProviderDialog,
      onJobSuccess,
    }: StartGenerationParams) => {
      if (isGenerating) return

      const provider = normalizeProvider({ ...rawProvider, outputFormat })
      const trimmedPrompt = prompt.trim()

      if (!provider.apiBaseUrl) {
        toast.error('请输入 API Base URL')
        onOpenProviderDialog()
        return
      }

      if (!provider.apiKey) {
        toast.error('请输入 API Key')
        onOpenProviderDialog()
        return
      }

      if (!trimmedPrompt) {
        toast.error('请输入提示词')
        return
      }

      const calculatedSize = getSize(sizeTier, aspectRatio)
      const batchId = createId('batch')
      const snapshot: GenerationSnapshot = {
        ...provider,
        prompt: trimmedPrompt,
        sizeTier,
        aspectRatio,
        size: calculatedSize,
        quality,
        batchCount,
        parallelCount,
        references: [...references],
        batchId,
      }

      setActiveBatchId(batchId)
      cancelledBatchIdsRef.current.delete(batchId)
      setIsGenerating(true)

      const newJobs: GenerationJob[] = Array.from({ length: batchCount }, (_, index) => ({
        id: createId('job'),
        batchId,
        index: index + 1,
        prompt: trimmedPrompt,
        quality,
        size: calculatedSize,
        createdAt: new Date().toISOString(),
        status: 'queued',
        responseStatus: 'queued',
        responseMessage: '等待执行',
      }))

      setJobs((prev) => [...newJobs, ...prev].slice(0, 40))
      toast.info(`创建 ${batchCount} 个任务，以 ${Math.min(batchCount, parallelCount)} 并发执行`)

      // Concurrency worker loop
      const executeJob = async (job: GenerationJob) => {
        if (cancelledBatchIdsRef.current.has(batchId)) {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === job.id
                ? {
                    ...j,
                    status: 'cancelled',
                    completedAt: new Date().toISOString(),
                    error: '任务已停止。',
                    responseStatus: 'cancelled',
                    responseMessage: '任务未开始，已停止',
                  }
                : j
            )
          )
          return
        }

        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  status: 'running',
                  startedAt: new Date().toISOString(),
                  error: undefined,
                  responseStatus: 'queued',
                  responseMessage: '正在建立响应流',
                }
              : j
          )
        )

        const controller = new AbortController()
        runningControllersRef.current.set(job.id, controller)

        try {
          const payload = await requestImage(
            snapshot,
            (update) => {
              setJobs((prev) =>
                prev.map((j) => (j.id === job.id ? { ...j, ...update } : j))
              )
            },
            controller.signal
          )

          // Text-only response
          if (payload.textResponse) {
            setJobs((prev) =>
              prev.map((j) =>
                j.id === job.id
                  ? {
                      ...j,
                      status: 'success',
                      completedAt: new Date().toISOString(),
                      textResponse: payload.textResponse,
                      size: snapshot.size,
                      responseStatus: 'completed',
                      responseMessage: '响应为文本内容（无图片）',
                    }
                  : j
              )
            )
            return
          }

          // Image response
          const imageDataUrl = payload.base64
            ? `data:image/${snapshot.outputFormat || 'png'};base64,${payload.base64}`
            : await imageUrlToDataUrl(payload.imageUrl!)

          const libraryItem: LibraryItem = {
            id: createId('img'),
            prompt: snapshot.prompt,
            size: payload.size || snapshot.size,
            quality: snapshot.quality,
            model: snapshot.model,
            providerName: snapshot.name || '',
            endpointType: snapshot.references.length > 0 ? 'images_edits' : 'images_generations',
            outputFormat: snapshot.outputFormat || 'png',
            imageDataUrl,
            createdAt: new Date().toISOString(),
            favorite: false,
            sourceType: snapshot.references.length > 0 ? 'edited' : 'generate',
            referenceCount: snapshot.references.length,
            batchId: job.batchId,
          }

          onJobSuccess(libraryItem)

          setJobs((prev) =>
            prev.map((j) =>
              j.id === job.id
                ? {
                    ...j,
                    status: 'success',
                    completedAt: new Date().toISOString(),
                    imageDataUrl,
                    resultId: libraryItem.id,
                    size: payload.size || snapshot.size,
                    responseStatus: 'completed',
                    responseMessage: '响应已完成',
                  }
                : j
            )
          )
        } catch (err: unknown) {
          const isAbort = (err as { name?: string })?.name === 'AbortError'
          const errorMsg = (err as Error)?.message || '生成失败。'
          setJobs((prev) =>
            prev.map((j) =>
              j.id === job.id
                ? {
                    ...j,
                    status: isAbort ? 'cancelled' : 'error',
                    completedAt: new Date().toISOString(),
                    error: isAbort ? '任务已停止。' : errorMsg,
                    responseStatus: isAbort ? 'cancelled' : 'failed',
                    responseMessage: isAbort ? '请求已取消' : '响应失败',
                  }
                : j
            )
          )
        } finally {
          runningControllersRef.current.delete(job.id)
        }
      }

      try {
        const concurrencyLimit = Math.max(1, Math.min(parallelCount, batchCount))
        let cursor = 0
        const worker = async () => {
          while (cursor < newJobs.length) {
            if (cancelledBatchIdsRef.current.has(batchId)) return
            const index = cursor
            cursor += 1
            const job = newJobs[index]
            if (job) {
              await executeJob(job)
            }
          }
        }

        const workers = Array.from({ length: concurrencyLimit }, () => worker())
        await Promise.allSettled(workers)

        toast.success('批次执行完成')
      } finally {
        setIsGenerating(false)
        setActiveBatchId(null)
      }
    },
    [isGenerating]
  )

  return {
    jobs,
    setJobs,
    activeBatchId,
    isGenerating,
    focusedBatchId,
    batchJobs,
    batchStats,
    startBatchGeneration,
    stopActiveBatch,
  }
}
