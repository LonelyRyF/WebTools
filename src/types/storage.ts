export type StorageType = 'local' | 's3' | 'webdav'

export interface S3Config {
  endpoint: string // e.g. https://s3.us-east-1.amazonaws.com or https://<account_id>.r2.cloudflarestorage.com
  region: string // e.g. us-east-1, auto
  bucket: string // e.g. my-images
  accessKeyId: string
  secretAccessKey: string
  publicUrlPrefix?: string // e.g. https://cdn.example.com or https://pub-xxx.r2.dev
  pathPrefix?: string // e.g. ai-images/
  forcePathStyle?: boolean // default true
}

export interface WebDavConfig {
  url: string // e.g. https://dav.jianguoyun.com/dav/
  username: string
  password: string
  pathPrefix?: string // e.g. ai-images/
}

export interface StorageConfig {
  type: StorageType
  autoUpload: boolean
  saveMetadataJson: boolean
  s3: S3Config
  webdav: WebDavConfig
}

export interface StorageUploadResult {
  success: boolean
  url?: string
  error?: string
}
