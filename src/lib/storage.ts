import type { LibraryItem } from '@/types/image'
import type {
  StorageConfig,
  StorageType,
  S3Config,
  WebDavConfig,
  StorageUploadResult,
} from '@/types/storage'

export const STORAGE_CONFIG_KEY = 'gpt-image-storage-config-v1'

export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  type: 'local',
  autoUpload: false,
  saveMetadataJson: true,
  s3: {
    endpoint: '',
    region: 'auto',
    bucket: '',
    accessKeyId: '',
    secretAccessKey: '',
    publicUrlPrefix: '',
    pathPrefix: 'ai-images/',
    forcePathStyle: true,
  },
  webdav: {
    url: '',
    username: '',
    password: '',
    pathPrefix: 'ai-images/',
  },
}

export function loadStorageConfig(): StorageConfig {
  if (typeof window === 'undefined') return DEFAULT_STORAGE_CONFIG
  try {
    const raw = localStorage.getItem(STORAGE_CONFIG_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_STORAGE_CONFIG,
        ...parsed,
        s3: {
          ...DEFAULT_STORAGE_CONFIG.s3,
          ...(parsed.s3 || {}),
        },
        webdav: {
          ...DEFAULT_STORAGE_CONFIG.webdav,
          ...(parsed.webdav || {}),
        },
      }
    }
  } catch (err) {
    console.error('Failed to load storage config from localStorage:', err)
  }
  return DEFAULT_STORAGE_CONFIG
}

export function saveStorageConfig(config: StorageConfig): void {
  try {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config))
  } catch (err) {
    console.error('Failed to save storage config to localStorage:', err)
  }
}

// Convert dataURL to Uint8Array and mimeType
export function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; mimeType: string } {
  const parts = dataUrl.split(',')
  const mimeMatch = parts[0]?.match(/:(.*?);/)
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'
  const base64 = parts[1] || ''
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return { bytes, mimeType }
}

// Base64 helper supporting UTF-8 for WebDAV Basic Auth
export function toBase64Utf8(str: string): string {
  try {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    )
  } catch {
    return btoa(str)
  }
}

// Web Crypto SHA-256 Digest
async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const encoded = typeof data === 'string' ? new TextEncoder().encode(data) : data
  const hash = await crypto.subtle.digest('SHA-256', encoded as unknown as BufferSource)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Web Crypto HMAC-SHA256
async function hmacSha256(
  key: ArrayBuffer | Uint8Array,
  data: string | Uint8Array
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const encoded = typeof data === 'string' ? new TextEncoder().encode(data) : data
  return await crypto.subtle.sign('HMAC', cryptoKey, encoded as unknown as BufferSource)
}

// Clean and normalize prefix path
export function normalizePathPrefix(prefix?: string): string {
  if (!prefix) return ''
  const cleaned = prefix.trim().replace(/^\/+/, '').replace(/\/+$/, '')
  return cleaned ? `${cleaned}/` : ''
}

// Clean and normalize base URL
export function normalizeUrl(url?: string): string {
  if (!url) return ''
  return url.trim().replace(/\/+$/, '')
}

// S3 SigV4 Request Signer and Executor
interface S3RequestOptions {
  method: 'GET' | 'PUT' | 'DELETE' | 'HEAD'
  config: S3Config
  key: string
  body?: Uint8Array | string
  contentType?: string
}

export async function executeS3Request({
  method,
  config,
  key,
  body,
  contentType,
}: S3RequestOptions): Promise<{ ok: boolean; status: number; text: string; url: string }> {
  const endpoint = normalizeUrl(config.endpoint)
  if (!endpoint) throw new Error('未配置 S3 Endpoint')
  if (!config.bucket) throw new Error('未配置 S3 Bucket 名称')
  if (!config.accessKeyId || !config.secretAccessKey) throw new Error('未配置 S3 访问密钥 (Access Key / Secret Key)')

  const urlObj = new URL(endpoint)
  const bucket = config.bucket.trim()
  const region = (config.region || 'auto').trim()
  const forcePathStyle = config.forcePathStyle !== false

  let host = urlObj.host
  let path = ''

  const encodedKey = key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  if (forcePathStyle) {
    const basePath = urlObj.pathname.replace(/\/+$/, '')
    path = `${basePath}/${encodeURIComponent(bucket)}/${encodedKey}`
  } else {
    host = `${bucket}.${urlObj.host}`
    const basePath = urlObj.pathname.replace(/\/+$/, '')
    path = `${basePath}/${encodedKey}`
  }

  const fullUrl = `${urlObj.protocol}//${host}${path}`

  // AWS SigV4 Timestamps
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)

  const bodyBytes =
    body === undefined
      ? new Uint8Array(0)
      : typeof body === 'string'
        ? new TextEncoder().encode(body)
        : body

  const payloadHash = await sha256Hex(bodyBytes)

  // Canonical Headers
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'

  // Canonical Request
  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
  const canonicalRequestHash = await sha256Hex(canonicalRequest)

  // String to sign
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`

  // Signing Key Derivation
  const kDate = await hmacSha256(new TextEncoder().encode(`AWS4${config.secretAccessKey.trim()}`), dateStamp)
  const kRegion = await hmacSha256(kDate, region)
  const kService = await hmacSha256(kRegion, 's3')
  const kSigning = await hmacSha256(kService, 'aws4_request')
  const signatureBuffer = await hmacSha256(kSigning, stringToSign)
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId.trim()}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const headers: Record<string, string> = {
    'Host': host,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    'Authorization': authorization,
  }

  if (contentType) {
    headers['Content-Type'] = contentType
  }

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' || method === 'DELETE' ? undefined : (bodyBytes as unknown as BodyInit),
  })

  const text = await res.text()
  return { ok: res.ok, status: res.status, text, url: fullUrl }
}

// Upload image and optional metadata to S3
export async function uploadToS3(
  item: LibraryItem,
  config: S3Config,
  saveMetadataJson = true
): Promise<StorageUploadResult> {
  try {
    const { bytes, mimeType } = dataUrlToBytes(item.imageDataUrl)
    const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png'
    const prefix = normalizePathPrefix(config.pathPrefix)
    const imageKey = `${prefix}${item.id}.${ext}`

    const res = await executeS3Request({
      method: 'PUT',
      config,
      key: imageKey,
      body: bytes,
      contentType: mimeType,
    })

    if (!res.ok) {
      const errMatch = res.text.match(/<Message>(.*?)<\/Message>/)
      const msg = errMatch ? errMatch[1] : `HTTP ${res.status}: ${res.text.slice(0, 120)}`
      return { success: false, error: `S3 上传失败: ${msg}` }
    }

    // Save JSON metadata alongside image if enabled
    if (saveMetadataJson) {
      const metaKey = `${prefix}${item.id}.json`
      const metaContent = JSON.stringify(
        {
          id: item.id,
          prompt: item.prompt,
          model: item.model,
          size: item.size,
          quality: item.quality,
          providerName: item.providerName,
          endpointType: item.endpointType,
          outputFormat: item.outputFormat,
          createdAt: item.createdAt,
          sourceType: item.sourceType,
          referenceCount: item.referenceCount,
          batchId: item.batchId,
        },
        null,
        2
      )
      executeS3Request({
        method: 'PUT',
        config,
        key: metaKey,
        body: metaContent,
        contentType: 'application/json; charset=utf-8',
      }).catch((e) => console.warn('Failed to upload metadata JSON to S3:', e))
    }

    let publicUrl = res.url
    if (config.publicUrlPrefix?.trim()) {
      publicUrl = `${normalizeUrl(config.publicUrlPrefix)}/${imageKey}`
    }

    return { success: true, url: publicUrl }
  } catch (err: unknown) {
    const msg = (err as Error)?.message || '网络错误或 CORS 受阻'
    return { success: false, error: `S3 请求异常: ${msg}` }
  }
}

// Test S3 Connection
export async function testS3Connection(config: S3Config): Promise<{ success: boolean; message: string }> {
  try {
    const prefix = normalizePathPrefix(config.pathPrefix)
    const testKey = `${prefix}.connection-test-${Date.now()}.txt`

    const res = await executeS3Request({
      method: 'PUT',
      config,
      key: testKey,
      body: 'WebTools S3 Connection Test OK',
      contentType: 'text/plain',
    })

    if (!res.ok) {
      const errMatch = res.text.match(/<Message>(.*?)<\/Message>/)
      const codeMatch = res.text.match(/<Code>(.*?)<\/Code>/)
      const code = codeMatch ? `[${codeMatch[1]}] ` : ''
      const msg = errMatch ? errMatch[1] : res.text.slice(0, 150) || `HTTP ${res.status}`
      return {
        success: false,
        message: `S3 权限或连接验证失败: ${code}${msg}`,
      }
    }

    // Try deleting test file
    executeS3Request({
      method: 'DELETE',
      config,
      key: testKey,
    }).catch(() => {})

    return { success: true, message: 'S3 对象存储连接与写入权限验证成功！' }
  } catch (err: unknown) {
    const msg = (err as Error)?.message || '连接错误'
    return {
      success: false,
      message: `无法连接到 S3 端点: ${msg}（如在浏览器运行，请确保 S3 存储桶已配置 CORS 允许当前域名访问）`,
    }
  }
}

// WebDAV Helper: Ensure collection directory exists via MKCOL
async function ensureWebDavDirectory(baseUrl: string, authHeader: string, prefix: string): Promise<void> {
  const parts = prefix.split('/').filter(Boolean)
  let current = baseUrl
  for (const part of parts) {
    current = `${current}/${encodeURIComponent(part)}`
    try {
      await fetch(current, {
        method: 'MKCOL',
        headers: {
          Authorization: authHeader,
        },
      })
    } catch {
      // 405 Method Not Allowed or 201 Created are typical
    }
  }
}

// Upload image to WebDAV
export async function uploadToWebDav(
  item: LibraryItem,
  config: WebDavConfig,
  saveMetadataJson = true
): Promise<StorageUploadResult> {
  try {
    const baseUrl = normalizeUrl(config.url)
    if (!baseUrl) throw new Error('未配置 WebDAV 服务器地址')
    if (!config.username) throw new Error('未配置 WebDAV 用户名')

    const authHeader = `Basic ${toBase64Utf8(`${config.username.trim()}:${config.password || ''}`)}`
    const prefix = normalizePathPrefix(config.pathPrefix)

    if (prefix) {
      await ensureWebDavDirectory(baseUrl, authHeader, prefix)
    }

    const { bytes, mimeType } = dataUrlToBytes(item.imageDataUrl)
    const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png'
    const fileName = `${item.id}.${ext}`
    const targetUrl = `${baseUrl}/${prefix}${fileName}`

    const res = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': mimeType,
      },
      body: bytes as unknown as BodyInit,
    })

    if (!res.ok && res.status !== 201 && res.status !== 204) {
      return {
        success: false,
        error: `WebDAV 上传失败: HTTP ${res.status} ${res.statusText}`,
      }
    }

    // Save metadata JSON alongside image if enabled
    if (saveMetadataJson) {
      const metaUrl = `${baseUrl}/${prefix}${item.id}.json`
      const metaContent = JSON.stringify(
        {
          id: item.id,
          prompt: item.prompt,
          model: item.model,
          size: item.size,
          quality: item.quality,
          providerName: item.providerName,
          endpointType: item.endpointType,
          outputFormat: item.outputFormat,
          createdAt: item.createdAt,
          sourceType: item.sourceType,
          referenceCount: item.referenceCount,
          batchId: item.batchId,
        },
        null,
        2
      )
      fetch(metaUrl, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: metaContent,
      }).catch((e) => console.warn('Failed to upload metadata JSON to WebDAV:', e))
    }

    return { success: true, url: targetUrl }
  } catch (err: unknown) {
    const msg = (err as Error)?.message || '网络连接或 CORS 异常'
    return { success: false, error: `WebDAV 上传异常: ${msg}` }
  }
}

// Test WebDAV Connection
export async function testWebDavConnection(config: WebDavConfig): Promise<{ success: boolean; message: string }> {
  try {
    const baseUrl = normalizeUrl(config.url)
    if (!baseUrl) throw new Error('请输入 WebDAV 服务器地址')
    if (!config.username) throw new Error('请输入 WebDAV 用户名')

    const authHeader = `Basic ${toBase64Utf8(`${config.username.trim()}:${config.password || ''}`)}`
    const prefix = normalizePathPrefix(config.pathPrefix)

    if (prefix) {
      await ensureWebDavDirectory(baseUrl, authHeader, prefix)
    }

    const testUrl = `${baseUrl}/${prefix}.connection-test-${Date.now()}.txt`
    const res = await fetch(testUrl, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'text/plain',
      },
      body: 'WebTools WebDAV Connection Test OK',
    })

    if (!res.ok && res.status !== 201 && res.status !== 204) {
      if (res.status === 401) {
        return { success: false, message: 'WebDAV 认证失败，请检查用户名与密码/应用令牌。' }
      }
      if (res.status === 403) {
        return { success: false, message: 'WebDAV 权限拒绝，请确认该账户对目标目录具有写入权限。' }
      }
      if (res.status === 404) {
        return { success: false, message: 'WebDAV 地址未找到 (404)，请确认 URL 路径是否正确。' }
      }
      return { success: false, message: `WebDAV 请求失败: HTTP ${res.status} ${res.statusText}` }
    }

    // Try deleting test file
    fetch(testUrl, {
      method: 'DELETE',
      headers: { Authorization: authHeader },
    }).catch(() => {})

    return { success: true, message: 'WebDAV 服务连接与写入测试成功！' }
  } catch (err: unknown) {
    const msg = (err as Error)?.message || '网络错误'
    return {
      success: false,
      message: `无法连接 WebDAV 服务: ${msg}（如在浏览器运行，请确保 WebDAV 服务端已允许 CORS 跨域访问）`,
    }
  }
}

// Unified image uploader based on storage type
export async function uploadImageToStorage(
  item: LibraryItem,
  config: StorageConfig
): Promise<StorageUploadResult> {
  if (config.type === 's3') {
    return uploadToS3(item, config.s3, config.saveMetadataJson)
  }
  if (config.type === 'webdav') {
    return uploadToWebDav(item, config.webdav, config.saveMetadataJson)
  }
  return { success: false, error: '未启用远程存储（当前为仅本地模式）' }
}

// Unified connection test based on active storage type
export async function testStorageConnection(
  config: StorageConfig,
  forcedType?: StorageType
): Promise<{ success: boolean; message: string }> {
  const targetType = forcedType || config.type
  if (targetType === 's3') {
    return testS3Connection(config.s3)
  }
  if (targetType === 'webdav') {
    return testWebDavConnection(config.webdav)
  }
  return { success: true, message: '当前为本地 IndexedDB 存储模式，无需远程连接。' }
}
