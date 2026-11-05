import type { GenerationJob } from '@/types/image'
import { formatDuration, getJobResponseSummary, getBatchElapsedMs } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

interface QueueTabProps {
  batchStats: {
    total: number
    running: number
    success: number
    error: number
    finished: number
    queued: number
  }
  focusedBatchId: string | null
  batchJobs: GenerationJob[]
  isGenerating: boolean
}

export function QueueTab({
  batchStats,
  focusedBatchId,
  batchJobs,
  isGenerating,
}: QueueTabProps) {
  return (
    <div className="space-y-3 mt-0 outline-none">
      <div className="grid grid-cols-4 gap-1">
        <div className="rounded-lg border bg-muted/30 p-1.5 text-center">
          <span className="text-sm font-bold text-foreground">{batchStats.total}</span>
          <p className="text-[9px] text-muted-foreground">总数</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-1.5 text-center">
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{batchStats.running}</span>
          <p className="text-[9px] text-muted-foreground">运行</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-1.5 text-center">
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{batchStats.success}</span>
          <p className="text-[9px] text-muted-foreground">完成</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-1.5 text-center">
          <span className="text-sm font-bold text-destructive">{batchStats.error}</span>
          <p className="text-[9px] text-muted-foreground">失败</p>
        </div>
      </div>

      {focusedBatchId && batchJobs.length > 0 ? (
        <div className="space-y-1.5 rounded-lg border bg-muted/20 p-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[11px]">批次 #{focusedBatchId.split('-').slice(-1)[0]}</span>
            <Badge variant={isGenerating ? 'default' : 'secondary'} className="text-[9px] h-4 px-1.5">
              {isGenerating ? '运行中' : '就绪'}
            </Badge>
          </div>

          <div className="text-[10px] text-muted-foreground">
            {isGenerating ? '已耗时' : '总耗时'}: {formatDuration(getBatchElapsedMs(batchJobs))} ·{' '}
            {batchStats.success}/{batchStats.total} 完成
          </div>

          <Progress
            value={batchStats.total ? Math.round((batchStats.finished / batchStats.total) * 100) : 0}
            className="h-1"
          />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed py-5 text-center text-xs text-muted-foreground">
          暂无执行中的批次任务。
        </div>
      )}

      <ScrollArea className="h-60 pr-1.5">
        <div className="space-y-1.5">
          {batchJobs.map((job) => {
            const isSuccess = job.status === 'success'
            const isRunning = job.status === 'running'
            const isError = job.status === 'error' || job.status === 'cancelled'
            return (
              <div key={job.id} className="rounded-md border bg-card p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold">#{job.index}</span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase h-3.5 px-1 ${
                      isRunning
                        ? 'border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                        : isSuccess
                          ? 'border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : isError
                            ? 'border-destructive/30 bg-destructive/10 text-destructive'
                            : 'border-border text-muted-foreground'
                    }`}
                  >
                    {job.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[10px] text-muted-foreground break-words break-all" title={job.prompt}>
                      {job.prompt}
                    </p>
                    {getJobResponseSummary(job) && (
                      <p className="font-mono text-[9px] text-muted-foreground truncate">
                        {getJobResponseSummary(job)}
                      </p>
                    )}
                    {job.error && (
                      <p className="text-[10px] text-destructive break-words break-all">{job.error}</p>
                    )}
                    {job.textResponse && !job.imageDataUrl && (
                      <div className="mt-1 max-h-14 overflow-y-auto rounded bg-muted/60 p-1 font-mono text-[9px] whitespace-pre-wrap break-words break-all">
                        {job.textResponse}
                      </div>
                    )}
                  </div>
                  {job.imageDataUrl && (
                    <img
                      src={job.imageDataUrl}
                      alt="preview"
                      className="size-8 shrink-0 rounded object-cover border"
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
