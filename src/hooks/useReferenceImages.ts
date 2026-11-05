import { useState, useEffect, useCallback } from 'react'
import type { ReferenceImage } from '@/types/image'
import { createId } from '@/lib/image-db'
import { toast } from 'sonner'

const MAX_IMAGE_SIZE = 20 * 1024 * 1024

export function useReferenceImages(onAdded?: () => void) {
  const [references, setReferences] = useState<ReferenceImage[]>([])

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList || [])
      let added = 0
      const newRefs: ReferenceImage[] = []

      for (const file of files) {
        if (!file || !file.type.startsWith('image/') || file.size > MAX_IMAGE_SIZE) {
          continue
        }
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
          newRefs.push({
            id: createId('ref'),
            name: file.name || `reference-${Date.now()}.png`,
            dataUrl,
          })
          added += 1
        } catch (err) {
          console.error('Failed to read file:', err)
        }
      }

      if (newRefs.length > 0) {
        setReferences((prev) => [...prev, ...newRefs])
        toast.success(`已添加 ${added} 张参考图`)
        onAdded?.()
      }
    },
    [onAdded]
  )

  // Paste image handler from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.files
      if (items && items.length > 0) {
        handleFiles(items)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handleFiles])

  const addReferences = useCallback(
    (items: { id: string; dataUrl: string }[]) => {
      const newRefs: ReferenceImage[] = items.map((item) => ({
        id: createId('ref'),
        name: `${item.id}.png`,
        dataUrl: item.dataUrl,
      }))
      setReferences((prev) => [...prev, ...newRefs])
      onAdded?.()
      toast.success(`已添加 ${items.length} 张图片到参考图区`)
    },
    [onAdded]
  )

  const removeReference = useCallback((id: string) => {
    setReferences((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const clearReferences = useCallback(() => {
    setReferences([])
  }, [])

  return {
    referenceImages: references,
    setReferences,
    handleFiles,
    addReferences,
    removeReference,
    clearReferences,
  }
}
