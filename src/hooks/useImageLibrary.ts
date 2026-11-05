import { useState, useEffect, useMemo, useCallback } from 'react'
import type { LibraryItem } from '@/types/image'
import {
  STORAGE_KEYS,
  readLibrarySnapshotFromDatabase,
  writeLibrarySnapshotToDatabase,
  loadLibraryFromLocalFallback,
  persistLibrary,
} from '@/lib/image-db'
import { downloadImage } from '@/lib/format'
import { toast } from 'sonner'

interface UseImageLibraryOptions {
  onRegisterClear?: (cb: () => void) => void
  requestConfirm: (
    title: string,
    description: string,
    onConfirm: () => void,
    variant?: 'default' | 'destructive'
  ) => void
}

export function useImageLibrary({
  onRegisterClear,
  requestConfirm,
}: UseImageLibraryOptions) {
  const [library, setLibrary] = useState<LibraryItem[]>([])
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set())

  // Filters & Search
  const [filter, setFilter] = useState<'all' | 'favorite' | 'edited'>('all')
  const [search, setSearch] = useState<string>('')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')

  // Initialize from IndexedDB
  useEffect(() => {
    let isMounted = true
    const initLibrary = async () => {
      let items: LibraryItem[] = []
      try {
        items = await readLibrarySnapshotFromDatabase()
      } catch (e) {
        console.error('Failed to read IndexedDB:', e)
      }

      if (items.length === 0) {
        items = loadLibraryFromLocalFallback()
        if (items.length > 0) {
          try {
            await writeLibrarySnapshotToDatabase(items)
            localStorage.removeItem(STORAGE_KEYS.library)
            localStorage.removeItem(STORAGE_KEYS.legacyHistory)
          } catch (e) {
            console.error('Migration error:', e)
          }
        }
      }

      if (isMounted) {
        setLibrary(items)
      }
    }

    initLibrary()

    return () => {
      isMounted = false
    }
  }, [])

  // Clear library
  const clearLibrary = useCallback(() => {
    if (library.length === 0) return
    requestConfirm(
      '确认清空整个图库？',
      '清空后将从本地 IndexedDB 中永久移除所有生成的图片与历史记录，该操作无法撤销。',
      () => {
        setLibrary([])
        setSelectedImageIds(new Set())
        persistLibrary([])
        toast.success('图库已清空')
      },
      'destructive'
    )
  }, [library.length, requestConfirm])

  useEffect(() => {
    if (onRegisterClear) {
      onRegisterClear(clearLibrary)
    }
  }, [onRegisterClear, clearLibrary])

  // Filtered & Sorted items
  const filteredLibrary = useMemo(() => {
    let items = [...library]
    if (filter === 'favorite') {
      items = items.filter((item) => item.favorite)
    } else if (filter === 'edited') {
      items = items.filter((item) => item.sourceType === 'edited')
    }

    if (search.trim()) {
      const kw = search.trim().toLowerCase()
      items = items.filter((item) => item.prompt.toLowerCase().includes(kw))
    }

    items.sort((a, b) => {
      const tA = new Date(a.createdAt).getTime()
      const tB = new Date(b.createdAt).getTime()
      return sort === 'oldest' ? tA - tB : tB - tA
    })

    return items
  }, [library, filter, search, sort])

  // Select logic
  const allVisibleSelected =
    filteredLibrary.length > 0 &&
    filteredLibrary.every((item) => selectedImageIds.has(item.id))

  const toggleSelectVisible = useCallback(() => {
    setSelectedImageIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        filteredLibrary.forEach((item) => next.delete(item.id))
      } else {
        filteredLibrary.forEach((item) => next.add(item.id))
      }
      return next
    })
  }, [allVisibleSelected, filteredLibrary])

  const toggleSelect = useCallback((id: string) => {
    setSelectedImageIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Favorite toggle
  const toggleFavorite = useCallback((id: string) => {
    setLibrary((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite } : item
      )
      persistLibrary(next)
      return next
    })
  }, [])

  // Add items
  const addLibraryItem = useCallback((item: LibraryItem) => {
    setLibrary((prev) => {
      const next = [item, ...prev]
      persistLibrary(next)
      return next
    })
  }, [])

  // Update item (e.g. cloudUrl)
  const updateLibraryItem = useCallback((id: string, updates: Partial<LibraryItem>) => {
    setLibrary((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      persistLibrary(next)
      return next
    })
  }, [])

  // Update batch items
  const updateBatchItems = useCallback((updatesMap: Map<string, Partial<LibraryItem>>) => {
    setLibrary((prev) => {
      const next = prev.map((item) => {
        const u = updatesMap.get(item.id)
        return u ? { ...item, ...u } : item
      })
      persistLibrary(next)
      return next
    })
  }, [])

  // Delete items
  const deleteSelected = useCallback(
    (ids: string[], onDeleted?: (deletedIds: Set<string>) => void) => {
      if (ids.length === 0) return
      requestConfirm(
        `确认删除选中的 ${ids.length} 张图片？`,
        '选中的图片将从本地存储中彻底移除，无法恢复。',
        () => {
          const deleteSet = new Set(ids)
          setLibrary((prev) => {
            const next = prev.filter((item) => !deleteSet.has(item.id))
            persistLibrary(next)
            return next
          })
          setSelectedImageIds((prev) => {
            const next = new Set(prev)
            ids.forEach((id) => next.delete(id))
            return next
          })
          onDeleted?.(deleteSet)
          toast.success(`已删除 ${ids.length} 张图片`)
        },
        'destructive'
      )
    },
    [requestConfirm]
  )

  // Download selected
  const downloadSelected = useCallback(() => {
    const items = library.filter((item) => selectedImageIds.has(item.id))
    if (items.length === 0) return

    items.forEach((item, index) => {
      window.setTimeout(() => {
        downloadImage(item.imageDataUrl, `image-${item.id}-${index + 1}.png`)
      }, index * 120)
    })
    toast.info(`正在下载 ${items.length} 张图片...`)
  }, [library, selectedImageIds])

  return {
    library,
    filteredLibrary,
    selectedImageIds,
    filter,
    setFilter,
    search,
    setSearch,
    sort,
    setSort,
    allVisibleSelected,
    toggleSelectVisible,
    toggleSelect,
    toggleFavorite,
    addLibraryItem,
    updateLibraryItem,
    updateBatchItems,
    deleteSelected,
    downloadSelected,
    clearLibrary,
  }
}
