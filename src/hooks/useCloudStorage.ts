import { useState, useCallback } from 'react'
import type { StorageConfig } from '@/types/storage'
import type { LibraryItem } from '@/types/image'
import { loadStorageConfig, saveStorageConfig, uploadImageToStorage } from '@/lib/storage'
import { toast } from 'sonner'

export function useCloudStorage() {
  const [storageConfig, setStorageConfig] = useState<StorageConfig>(() => loadStorageConfig())
  const [isStorageDialogOpen, setIsStorageDialogOpen] = useState<boolean>(false)

  const handleSaveConfig = useCallback((newCfg: StorageConfig) => {
    setStorageConfig(newCfg)
    saveStorageConfig(newCfg)
  }, [])

  const uploadSingle = useCallback(
    async (item: LibraryItem): Promise<string | null> => {
      if (storageConfig.type === 'local') {
        setIsStorageDialogOpen(true)
        toast.info('请先配置并启用 S3 或 WebDAV 云存储')
        return null
      }

      const toastId = `upload-${item.id}`
      toast.loading(`正在上传至 ${storageConfig.type.toUpperCase()}...`, { id: toastId })
      try {
        const res = await uploadImageToStorage(item, storageConfig)
        if (res.success && res.url) {
          toast.success(`上传成功！已同步至 ${storageConfig.type.toUpperCase()}`, { id: toastId })
          return res.url
        } else {
          toast.error(res.error || '上传失败', { id: toastId })
          return null
        }
      } catch (e: unknown) {
        toast.error((e as Error)?.message || '上传异常', { id: toastId })
        return null
      }
    },
    [storageConfig]
  )

  const uploadBatch = useCallback(
    async (items: LibraryItem[]): Promise<Map<string, string>> => {
      const resultMap = new Map<string, string>()
      if (items.length === 0) return resultMap

      if (storageConfig.type === 'local') {
        setIsStorageDialogOpen(true)
        toast.info('请先配置并启用 S3 或 WebDAV 云存储')
        return resultMap
      }

      const toastId = 'batch-cloud-upload'
      toast.loading(`正在批量上传 ${items.length} 张图片至 ${storageConfig.type.toUpperCase()}...`, {
        id: toastId,
      })

      let successCount = 0
      let failCount = 0

      for (const item of items) {
        try {
          const res = await uploadImageToStorage(item, storageConfig)
          if (res.success && res.url) {
            successCount += 1
            resultMap.set(item.id, res.url)
          } else {
            failCount += 1
          }
        } catch {
          failCount += 1
        }
      }

      if (failCount === 0) {
        toast.success(`全部 ${successCount} 张图片已成功备份至云端！`, { id: toastId })
      } else {
        toast.info(`上传完成：成功 ${successCount} 张，失败 ${failCount} 张`, { id: toastId })
      }

      return resultMap
    },
    [storageConfig]
  )

  return {
    storageConfig,
    isStorageDialogOpen,
    setIsStorageDialogOpen,
    handleSaveConfig,
    uploadSingle,
    uploadBatch,
  }
}
