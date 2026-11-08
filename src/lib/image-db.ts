import type { LibraryItem, ProviderConfig } from '@/types/image'

export const STORAGE_KEYS = {
  providers: 'gpt-image-providers-v1',
  selectedProviderId: 'gpt-image-selected-provider-v1',
  apiBaseUrl: 'gpt-image-api-base-url',
  apiKey: 'gpt-image-api-key',
  model: 'gpt-image-model',
  library: 'gpt-image-library-v2',
  legacyHistory: 'gpt-image-history',
}

export const LIBRARY_DB = {
  name: 'gpt-image-workspace',
  version: 1,
  store: 'library',
}

export const DEFAULT_PROVIDER: ProviderConfig = {
  id: 'provider-default',
  name: 'Default Provider',
  apiBaseUrl: 'https://diaodiao.net',
  apiKey: '',
  model: 'gpt-image-2.5-sunburst',
  endpointType: 'images_generations',
  outputFormat: 'png',
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

export function normalizeBaseUrl(url: string): string {
  return String(url || '').trim().replace(/\/+$/, '')
}

export function normalizeProvider(provider?: Partial<ProviderConfig>): ProviderConfig {
  return {
    ...DEFAULT_PROVIDER,
    ...provider,
    id: provider?.id || createId('provider'),
    name: provider?.name || 'Default',
    apiBaseUrl: normalizeBaseUrl(provider?.apiBaseUrl || DEFAULT_PROVIDER.apiBaseUrl),
    endpointType: provider?.endpointType || 'images_generations',
    outputFormat: provider?.outputFormat || 'png',
  }
}

export function loadStoredProviders(): { providers: ProviderConfig[]; selectedId: string } {
  let providers: ProviderConfig[] = []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.providers)
    if (raw) {
      providers = JSON.parse(raw)
    }
  } catch (error) {
    console.error('Failed to parse providers from localStorage:', error)
  }

  if (!Array.isArray(providers) || providers.length === 0) {
    providers = [
      normalizeProvider({
        name: 'Default',
        apiBaseUrl: localStorage.getItem(STORAGE_KEYS.apiBaseUrl) || 'https://diaodiao.net',
        apiKey: localStorage.getItem(STORAGE_KEYS.apiKey) || '',
        model: localStorage.getItem(STORAGE_KEYS.model) || 'gpt-image-2.5-sunburst',
      }),
    ]
  } else {
    providers = providers.map(normalizeProvider)
  }

  let selectedId = localStorage.getItem(STORAGE_KEYS.selectedProviderId) || providers[0].id
  if (!providers.some((p) => p.id === selectedId)) {
    selectedId = providers[0].id
  }

  return { providers, selectedId }
}

export function saveStoredProviders(providers: ProviderConfig[], selectedId: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.providers, JSON.stringify(providers))
    localStorage.setItem(STORAGE_KEYS.selectedProviderId, selectedId)
  } catch (error) {
    console.error('Failed to save providers to localStorage:', error)
  }
}

export function normalizeLibraryItems(items: unknown[]): LibraryItem[] {
  if (!Array.isArray(items)) return []

  return items
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && 'imageDataUrl' in item && Boolean(item.imageDataUrl))
    .map((item) => ({
      id: String(item.id || createId('img')),
      prompt: String(item.prompt || ''),
      size: String(item.size || 'auto'),
      quality: String(item.quality || 'auto'),
      model: String(item.model || 'gpt-image-2.5-sunburst'),
      providerName: String(item.providerName || ''),
      endpointType: String(item.endpointType || ''),
      outputFormat: String(item.outputFormat || 'png'),
      imageDataUrl: String(item.imageDataUrl),
      createdAt: String(item.createdAt || new Date().toISOString()),
      favorite: Boolean(item.favorite),
      sourceType: item.sourceType === 'edited' ? 'edited' : 'generate',
      referenceCount: Number(item.referenceCount || 0),
      batchId: item.batchId ? String(item.batchId) : undefined,
      cloudUrl: item.cloudUrl ? String(item.cloudUrl) : undefined,
      cloudStorageType: item.cloudStorageType ? (String(item.cloudStorageType) as 's3' | 'webdav') : undefined,
      cloudUploadedAt: item.cloudUploadedAt ? String(item.cloudUploadedAt) : undefined,
    }))
}

export function mergeLibraryItems(currentItems: LibraryItem[], incomingItems: LibraryItem[]): LibraryItem[] {
  const merged: LibraryItem[] = []
  const seen = new Set<string>()

  for (const item of [...currentItems, ...incomingItems]) {
    if (!seen.has(item.id)) {
      seen.add(item.id)
      merged.push(item)
    }
  }

  return merged
}

let libraryDbPromise: Promise<IDBDatabase> | null = null

export function openLibraryDatabase(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB is not available'))
  }

  if (libraryDbPromise) {
    return libraryDbPromise
  }

  libraryDbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(LIBRARY_DB.name, LIBRARY_DB.version)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(LIBRARY_DB.store)) {
        db.createObjectStore(LIBRARY_DB.store, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('IndexedDB upgrade was blocked'))
  })

  return libraryDbPromise
}

export async function readLibrarySnapshotFromDatabase(): Promise<LibraryItem[]> {
  const db = await openLibraryDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LIBRARY_DB.store, 'readonly')
    const store = transaction.objectStore(LIBRARY_DB.store)
    const request = store.getAll()

    request.onsuccess = () => {
      resolve(normalizeLibraryItems(request.result))
    }
    request.onerror = () => reject(request.error || new Error('IndexedDB read request failed'))
  })
}

export async function writeLibrarySnapshotToDatabase(snapshot: LibraryItem[]): Promise<void> {
  const db = await openLibraryDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LIBRARY_DB.store, 'readwrite')
    const store = transaction.objectStore(LIBRARY_DB.store)

    store.clear()
    for (const item of snapshot) {
      store.put(item)
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error || new Error('Failed to write library'))
    transaction.onabort = () => reject(transaction.error || new Error('Library write aborted'))
  })
}

export function loadLibraryFromLocalFallback(): LibraryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.library)
    if (raw) {
      return normalizeLibraryItems(JSON.parse(raw))
    }
    const legacy = localStorage.getItem(STORAGE_KEYS.legacyHistory)
    if (legacy) {
      const parsed = JSON.parse(legacy)
      if (Array.isArray(parsed)) {
        return normalizeLibraryItems(
          parsed.map((item) => ({
            id: item.id || createId('img'),
            prompt: item.prompt || '',
            size: item.size || 'auto',
            quality: item.quality || 'auto',
            model: 'gpt-image-2.5-sunburst',
            imageDataUrl: item.imageDataUrl,
            createdAt: item.createdAt || new Date().toISOString(),
            favorite: false,
            sourceType: 'generate',
            referenceCount: 0,
          }))
        )
      }
    }
  } catch (error) {
    console.error('Failed to load library fallback:', error)
  }
  return []
}

export function saveLibraryToLocalFallback(snapshot: LibraryItem[]): boolean {
  const nextLibrary = [...snapshot]
  while (nextLibrary.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEYS.library, JSON.stringify(nextLibrary))
      return true
    } catch {
      nextLibrary.pop()
    }
  }
  if (snapshot.length === 0) {
    localStorage.removeItem(STORAGE_KEYS.library)
    return true
  }
  return false
}

let saveQueue: Promise<void> = Promise.resolve()

export function persistLibrary(items: LibraryItem[]): Promise<void> {
  const snapshot = normalizeLibraryItems(items)
  saveQueue = saveQueue
    .then(() => writeLibrarySnapshotToDatabase(snapshot))
    .catch((error) => {
      console.warn('IndexedDB write failed, falling back to localStorage:', error)
      saveLibraryToLocalFallback(snapshot)
    })
  return saveQueue
}
