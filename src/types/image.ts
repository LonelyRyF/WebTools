export type EndpointType = 'images_generations' | 'images_edits' | 'responses' | 'auto'
export type OutputFormat = 'png' | 'jpeg' | 'webp'
export type QualityTier = 'auto' | 'low' | 'medium' | 'high'
export type SizeTier = 'auto' | '1k' | '2k' | '4k'
export type JobStatus = 'queued' | 'running' | 'success' | 'error' | 'cancelled'

export interface ProviderConfig {
  id: string
  name: string
  apiBaseUrl: string
  apiKey: string
  model: string
  endpointType?: EndpointType
  outputFormat: OutputFormat
}

export interface ReferenceImage {
  id: string
  name: string
  dataUrl: string
}

export interface LibraryItem {
  id: string
  prompt: string
  size: string
  quality: string
  model: string
  providerName: string
  endpointType: string
  outputFormat: string
  imageDataUrl: string
  createdAt: string
  favorite: boolean
  sourceType: 'generate' | 'edited'
  referenceCount: number
  batchId?: string
  cloudUrl?: string
  cloudStorageType?: 's3' | 'webdav'
  cloudUploadedAt?: string
}

export interface GenerationJob {
  id: string
  batchId: string
  index: number
  prompt: string
  quality: string
  size: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  status: JobStatus
  error?: string
  imageDataUrl?: string
  resultId?: string
  responseStatus?: string
  responseMessage?: string
  textResponse?: string
}

export interface GenerationSnapshot extends ProviderConfig {
  prompt: string
  sizeTier: SizeTier
  aspectRatio: string
  size: string
  quality: QualityTier
  batchCount: number
  parallelCount: number
  references: ReferenceImage[]
  batchId?: string
}
