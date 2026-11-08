import { useState, useEffect, useMemo, useCallback } from 'react'
import type { LibraryItem } from '@/types/image'
import {
  STORAGE_KEYS,
  readLibrarySnapshotFromDatabase,
  writeLibrarySnapshotToDatabase,
  loadLibraryFromLocalFallback,
  persistLibrary,
  mergeLibraryItems,
} from '@/lib/image-db'
import { downloadLibraryItem } from '@/lib/format'
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
  const [initStatus, setInitStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set())

  // Filters & Search
  const [filter, setFilter] = useState<'all' | 'favorite' | 'edited'>('all')
  const [search, setSearch] = useState<string>('')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')

  // Initialize from IndexedDB with strict failure guard
  const loadLibrary = useCallback(async () => {
    try {
      let items = await readLibrarySnapshotFromDatabase()

      // If IndexedDB is clean empty, check legacy localStorage fallback
      if (items.length === 0) {
        const fallback = loadLibraryFromLocalFallback()
        if (fallback.length > 0) {
          try {
            await writeLibrarySnapshotToDatabase(fallback)
            localStorage.removeItem(STORAGE_KEYS.library)
            localStorage.removeItem(STORAGE_KEYS.legacyHistory)
            items = fallback
          } catch (migrationErr) {
            console.error('Migration error:', migrationErr)
          }
        }
      }

      setLibrary((prev) => mergeLibraryItems(prev, items))
      setInitStatus('ready')
    } catch (err) {
      console.error('Failed to read IndexedDB snapshot:', err)
      setInitStatus('error')
      toast.error('图库数据读取失败，已暂停持久化同步以防数据覆盖。请刷新重试。')
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    readLibrarySnapshotFromDatabase()
      .then((items) => {
        if (!isMounted) return
        if (items.length === 0) {
          const fallback = loadLibraryFromLocalFallback()
          if (fallback.length > 0) {
            writeLibrarySnapshotToDatabase(fallback).catch((e) =>
              console.error('Migration error:', e)
            )
            localStorage.removeItem(STORAGE_KEYS.library)
            localStorage.removeItem(STORAGE_KEYS.legacyHistory)
            setLibrary((prev) => mergeLibraryItems(prev, fallback))
            setInitStatus('ready')
            return
          }
        }
        setLibrary((prev) => mergeLibraryItems(prev, items))
        setInitStatus('ready')
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Failed to read IndexedDB snapshot:', err)
        setInitStatus('error')
        toast.error('图库数据读取失败，已暂停持久化同步以防数据覆盖。请刷新重试。')
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Centralized persistence effect: ONLY write when initStatus is strictly 'ready'
  useEffect(() => {
    if (initStatus !== 'ready') return
    persistLibrary(library)
  }, [library, initStatus])

  // Clear library
  const clearLibrary = useCallback(() => {
    if (library.length === 0) return
    requestConfirm(
      '确认清空整个图库？',
      '清空后将从本地 IndexedDB 中永久移除所有生成的图片与历史记录，该操作无法撤销。',
      () => {
        setLibrary([])
        setSelectedImageIds(new Set())
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

  // Favorite toggle (pure state update, persistence handled by effect)
  const toggleFavorite = useCallback((id: string) => {
    setLibrary((prev) =>
      prev.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item))
    )
  }, [])

  // Add items
  const addLibraryItem = useCallback((item: LibraryItem) => {
    setLibrary((prev) => [item, ...prev])
  }, [])

  // Update item
  const updateLibraryItem = useCallback((id: string, updates: Partial<LibraryItem>) => {
    setLibrary((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }, [])

  // Update batch items
  const updateBatchItems = useCallback((updatesMap: Map<string, Partial<LibraryItem>>) => {
    setLibrary((prev) =>
      prev.map((item) => {
        const u = updatesMap.get(item.id)
        return u ? { ...item, ...u } : item
      })
    )
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
          setLibrary((prev) => prev.filter((item) => !deleteSet.has(item.id)))
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

  // Download selected using accurate format extension
  const downloadSelected = useCallback(() => {
    const items = library.filter((item) => selectedImageIds.has(item.id))
    if (items.length === 0) return

    items.forEach((item, index) => {
      window.setTimeout(() => {
        downloadLibraryItem(item)
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
    initStatus,
    retryLoadLibrary: loadLibrary,
  }
}
