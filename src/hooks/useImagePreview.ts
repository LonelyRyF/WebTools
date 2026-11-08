import { useState, useCallback, useMemo, useEffect } from 'react'
import type { LibraryItem } from '@/types/image'

interface UseImagePreviewOptions {
  library: LibraryItem[]
  filteredItems: LibraryItem[]
}

export function useImagePreview({ library, filteredItems }: UseImagePreviewOptions) {
  const [previewId, setPreviewId] = useState<string | null>(null)

  // Derive previewItem from the full library so even if filters change, the item data is stable
  const previewItem = useMemo(() => {
    if (!previewId) return null
    return library.find((item) => item.id === previewId) ?? null
  }, [library, previewId])

  // Derive index from currently filtered view for navigation
  const previewIndex = useMemo(() => {
    if (!previewId) return -1
    return filteredItems.findIndex((item) => item.id === previewId)
  }, [filteredItems, previewId])

  const openPreview = useCallback((id: string) => {
    setPreviewId(id)
  }, [])

  const closePreview = useCallback(() => {
    setPreviewId(null)
  }, [])

  const navigatePreview = useCallback(
    (step: number) => {
      if (filteredItems.length === 0) return
      let nextIdx = previewIndex + step
      if (nextIdx < 0) nextIdx = 0
      if (nextIdx >= filteredItems.length) nextIdx = filteredItems.length - 1
      const nextItem = filteredItems[nextIdx]
      if (nextItem) {
        setPreviewId(nextItem.id)
      }
    },
    [filteredItems, previewIndex]
  )

  // If previewId no longer exists in library, treat effective active item as null
  const effectivePreviewId = previewItem ? previewId : null

  // Keyboard navigation for active modal - only active when previewItem actually exists
  useEffect(() => {
    if (!previewItem) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'ArrowLeft') {
        navigatePreview(-1)
      } else if (e.key === 'ArrowRight') {
        navigatePreview(1)
      } else if (e.key === 'Escape') {
        setPreviewId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewItem, navigatePreview])

  return {
    previewId: effectivePreviewId,
    previewItem,
    previewIndex,
    openPreview,
    closePreview,
    navigatePreview,
  }
}
