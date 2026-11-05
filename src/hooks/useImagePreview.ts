import { useState, useCallback, useEffect } from 'react'
import type { LibraryItem } from '@/types/image'

export function useImagePreview(items: LibraryItem[]) {
  const [previewItem, setPreviewItem] = useState<LibraryItem | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number>(-1)

  const openPreview = useCallback(
    (item: LibraryItem) => {
      const idx = items.findIndex((x) => x.id === item.id)
      setPreviewItem(item)
      setPreviewIndex(idx >= 0 ? idx : 0)
    },
    [items]
  )

  const closePreview = useCallback(() => {
    setPreviewItem(null)
  }, [])

  const navigatePreview = useCallback(
    (step: number) => {
      if (items.length === 0) return
      const nextIdx = previewIndex + step
      if (nextIdx < 0 || nextIdx >= items.length) return
      setPreviewIndex(nextIdx)
      setPreviewItem(items[nextIdx])
    },
    [items, previewIndex]
  )

  // Sync updated item data into previewItem (e.g. cloudUrl added)
  const updatePreviewItem = useCallback((updated: Partial<LibraryItem>) => {
    setPreviewItem((prev) => (prev ? { ...prev, ...updated } : null))
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewItem) return
      if (e.key === 'ArrowLeft') {
        navigatePreview(-1)
      } else if (e.key === 'ArrowRight') {
        navigatePreview(1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewItem, navigatePreview])

  return {
    previewItem,
    previewIndex,
    openPreview,
    closePreview,
    navigatePreview,
    updatePreviewItem,
  }
}
