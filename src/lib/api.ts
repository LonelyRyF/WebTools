import type { EndpointType, GenerationSnapshot } from '@/types/image'

export const endpointLabels: Record<EndpointType, string> = {
  responses: '/v1/responses',
  images_generations: '/v1/images/generations',
  images_edits: '/v1/images/edits',
  auto: '自动端点',
}

export const sizeMap: Record<string, Record<string, string>> = {
  '1k': {
    '1:1': '1024x1024',
    '3:2': '1536x1024',
    '2:3': '1024x1536',
  },
  '2k': {
    '1:1': '2048x2048',
    '16:9': '2048x1152',
  },
  '4k': {
    '16:9': '3840x2160',
    '9:16': '2160x3840',
  },
}

export const aspectRatioMap: Record<string, string[]> = {
  auto: ['1:1', '16:9', '9:16', '3:2', '2:3'],
  '1k': ['1:1', '3:2', '2:3'],
  '2k': ['1:1', '16:9'],
  '4k': ['16:9', '9:16'],
}

export function getSize(sizeTier: string, aspectRatio: string): string {
  if (sizeTier === 'auto') {
    return 'auto'
  }
  return sizeMap[sizeTier]?.[aspectRatio] || 'auto'
}

export function getMimeFromDataUrl(dataUrl: string): string {
  return /^data:([^;]+);/i.exec(dataUrl || '')?.[1] || 'image/png'
}

export function getExtensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  }
  return map[mime] || 'png'
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, data] = String(dataUrl).split(',')
  const mime = /^data:([^;]+);/i.exec(meta || '')?.[1] || 'image/png'
  const binary = atob(data || '')
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new Blob([bytes], { type: mime })
}

export function detectFormatFromBase64(base64: string): 'png' | 'jpeg' | 'webp' {
  // Check magic bytes from leading base64 characters
  const trimmed = base64.trim().slice(0, 16)
  if (trimmed.startsWith('iVBORw0KGgo')) return 'png'
  if (trimmed.startsWith('/9j/')) return 'jpeg'
  if (trimmed.startsWith('UklGR')) return 'webp'
  return 'png'
}

export function detectFormatFromMime(mime: string): 'png' | 'jpeg' | 'webp' {
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpeg'
  return 'png'
}

export async function imageUrlToDataUrl(
  url: string,
  signal?: AbortSignal
): Promise<{ dataUrl: string; format: 'png' | 'jpeg' | 'webp' }> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`图片 URL 下载失败 (${response.status})`)
  }
  const blob = await response.blob()
  const format = detectFormatFromMime(blob.type)
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  return { dataUrl, format }
}

export function describeResponseStatus(status: string): string {
  switch (status) {
    case 'queued':
      return '等待执行'
    case 'in_progress':
      return '处理中'
    case 'completed':
      return '已完成'
    case 'failed':
      return '失败'
    case 'incomplete':
      return '未完成'
    case 'cancelled':
      return '已取消'
    default:
      return status || ''
  }
}

export function buildRequestBody(snapshot: GenerationSnapshot) {
  const content =
    snapshot.references.length > 0
      ? [
          { type: 'input_text', text: snapshot.prompt },
          ...snapshot.references.map((item) => ({
            type: 'input_image',
            image_url: item.dataUrl,
          })),
        ]
      : snapshot.prompt

  const tool: Record<string, unknown> = {
    type: 'image_generation',
    output_format: snapshot.outputFormat || 'png',
    size: snapshot.size || getSize(snapshot.sizeTier, snapshot.aspectRatio),
    quality: snapshot.quality,
  }

  if (snapshot.references.length > 0) {
    tool.action = 'edit'
  }

  return {
    model: snapshot.model,
    input: [
      {
        role: 'user',
        content,
      },
    ],
    tools: [tool],
    instructions: 'you are a helpful assistant',
    tool_choice: 'auto',
    stream: true,
    store: false,
  }
}

export interface StreamUpdate {
  responseStatus?: string
  responseMessage?: string
  responseEventType?: string
}

export function extractStreamUpdate(data: Record<string, unknown>): StreamUpdate | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const type = typeof data.type === 'string' ? data.type : ''
  const item = (data.item || data.output_item) as Record<string, unknown> | null
  const itemType = (item?.type as string) || ''
  const respObj = data.response as Record<string, unknown> | undefined
  const responseStatus =
    typeof respObj?.status === 'string'
      ? respObj.status
      : typeof data.status === 'string'
        ? data.status
        : typeof item?.status === 'string'
          ? (item.status as string)
          : ''

  let responseMessage = ''

  switch (type) {
    case 'response.created':
      responseMessage = '响应已创建'
      break
    case 'response.in_progress':
      responseMessage = '模型处理中'
      break
    case 'response.output_item.added':
      responseMessage =
        itemType === 'image_generation_call' ? '图片生成工具已启动' : '输出项已创建'
      break
    case 'response.output_item.done':
      responseMessage =
        itemType === 'image_generation_call' ? '图片结果已生成' : '输出项已完成'
      break
    case 'response.completed':
      responseMessage = '响应已完成'
      break
    case 'response.failed':
      responseMessage = '响应失败'
      break
    case 'response.incomplete':
      responseMessage = '响应未完成'
      break
    default:
      if (itemType === 'image_generation_call') {
        responseMessage = '图片生成中'
      }
  }

  if (!responseMessage && !responseStatus) {
    return null
  }

  return {
    responseStatus,
    responseMessage: responseMessage || `响应${describeResponseStatus(responseStatus)}`,
    responseEventType: type,
  }
}

export interface ImageResultPayload {
  base64?: string
  imageUrl?: string
  size?: string
  textResponse?: string
}

export function parseImageResponseEvent(
  eventData: string,
  fallbackSize: string
): {
  isComplete?: boolean
  error?: string
  imagePayload?: { base64: string; size: string } | null
  textContent?: string
  streamUpdate?: StreamUpdate | null
} | null {
  if (!eventData) {
    return null
  }

  if (eventData === '[DONE]') {
    return { isComplete: true }
  }

  try {
    const data = JSON.parse(eventData)

    if (data.type === 'error' || data.type === 'response.error') {
      return {
        error: data.error?.message || data.message || 'Generation failed',
        streamUpdate: {
          responseStatus: 'failed',
          responseMessage: '响应失败',
          responseEventType: data.type || 'response.error',
        },
      }
    }

    const items: Array<Record<string, unknown>> = []
    if (data.item) {
      items.push(data.item)
    }
    if (Array.isArray(data.output)) {
      items.push(...data.output)
    }
    if (Array.isArray(data.response?.output)) {
      items.push(...data.response.output)
    }

    let imagePayload: { base64: string; size: string } | null = null
    let textContent = ''
    for (const item of items) {
      if (item?.type === 'image_generation_call' && item.result) {
        imagePayload = {
          base64: String(item.result),
          size: String(item.size || fallbackSize),
        }
        break
      }
      if (item?.type === 'message' && Array.isArray(item.content)) {
        for (const part of item.content as Array<Record<string, unknown>>) {
          if ((part?.type === 'output_text' || part?.type === 'text') && typeof part.text === 'string') {
            textContent += part.text
          }
        }
      }
    }

    return {
      imagePayload,
      textContent,
      isComplete: data.type === 'response.completed',
      streamUpdate: extractStreamUpdate(data),
    }
  } catch (error) {
    console.error('Failed to parse event payload:', error)
    return null
  }
}

function extractImagesApiPayload(json: Record<string, unknown>, fallbackSize: string): ImageResultPayload {
  const dataList = json?.data as Array<Record<string, unknown>> | undefined
  const first = Array.isArray(dataList) ? dataList[0] : null
  if (!first) {
    const errObj = json?.error as { message?: string } | undefined
    throw new Error(errObj?.message || '响应中没有图片数据。')
  }
  if (first.b64_json) {
    return { base64: String(first.b64_json), size: String(first.size || fallbackSize) }
  }
  if (first.url) {
    return { imageUrl: String(first.url), size: String(first.size || fallbackSize) }
  }
  throw new Error('未从 Images API 响应中提取到 b64_json 或 url。')
}

async function parseJsonResponse(response: Response): Promise<{
  json: Record<string, unknown> | null
  rawText: string
}> {
  const rawText = await response.text()
  try {
    const json = JSON.parse(rawText) as Record<string, unknown>
    return { json, rawText }
  } catch {
    return { json: null, rawText }
  }
}

export async function requestImagesGeneration(
  snapshot: GenerationSnapshot,
  signal: AbortSignal
): Promise<ImageResultPayload> {
  const response = await fetch(`${snapshot.apiBaseUrl}/v1/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${snapshot.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: snapshot.model,
      prompt: snapshot.prompt,
      n: 1,
      size: snapshot.size,
      quality: snapshot.quality,
      response_format: 'b64_json',
      output_format: snapshot.outputFormat,
    }),
    signal,
  })

  const { json, rawText } = await parseJsonResponse(response)

  if (!response.ok) {
    const err = json?.error as { message?: string } | undefined
    throw new Error(
      `Request failed (${response.status}): ${err?.message || rawText || response.statusText}`
    )
  }

  if (!json) {
    throw new Error(`响应解析失败：预期 JSON 格式，但收到: ${rawText.slice(0, 200)}`)
  }

  return extractImagesApiPayload(json, snapshot.size)
}

export async function requestImagesEdit(
  snapshot: GenerationSnapshot,
  signal: AbortSignal
): Promise<ImageResultPayload> {
  const form = new FormData()
  form.append('model', snapshot.model)
  form.append('prompt', snapshot.prompt)
  form.append('n', '1')
  form.append('size', snapshot.size)
  form.append('quality', snapshot.quality)
  form.append('response_format', 'b64_json')
  if (snapshot.outputFormat) {
    form.append('output_format', snapshot.outputFormat)
  }

  snapshot.references.forEach((item, index) => {
    const blob = dataUrlToBlob(item.dataUrl)
    form.append(
      'image',
      blob,
      item.name || `reference-${index + 1}.${getExtensionFromMime(blob.type)}`
    )
  })

  const response = await fetch(`${snapshot.apiBaseUrl}/v1/images/edits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${snapshot.apiKey}`,
    },
    body: form,
    signal,
  })

  const { json, rawText } = await parseJsonResponse(response)

  if (!response.ok) {
    const err = json?.error as { message?: string } | undefined
    throw new Error(
      `Request failed (${response.status}): ${err?.message || rawText || response.statusText}`
    )
  }

  if (!json) {
    throw new Error(`响应解析失败：预期 JSON 格式，但收到: ${rawText.slice(0, 200)}`)
  }

  return extractImagesApiPayload(json, snapshot.size)
}

export async function requestResponsesImage(
  snapshot: GenerationSnapshot,
  onUpdate: (update: StreamUpdate) => void,
  signal: AbortSignal
): Promise<ImageResultPayload> {
  const response = await fetch(`${snapshot.apiBaseUrl}/v1/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${snapshot.apiKey}`,
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildRequestBody(snapshot)),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Request failed (${response.status}): ${errorText}`)
  }

  if (!response.body) {
    throw new Error('响应体为空，无法读取图片流。')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const fallbackSize = getSize(snapshot.sizeTier, snapshot.aspectRatio)
  let latestImagePayload: { base64: string; size: string } | null = null
  let collectedText = ''
  let responseCompleted = false

  const consumeEventData = (eventData: string) => {
    const parsedEvent = parseImageResponseEvent(eventData, fallbackSize)
    if (!parsedEvent) {
      return
    }

    if (parsedEvent.streamUpdate) {
      onUpdate(parsedEvent.streamUpdate)
    }

    if (parsedEvent.error) {
      throw new Error(parsedEvent.error)
    }

    if (parsedEvent.imagePayload && !latestImagePayload) {
      latestImagePayload = parsedEvent.imagePayload
    }

    if (parsedEvent.textContent) {
      collectedText += parsedEvent.textContent
    }

    if (parsedEvent.isComplete) {
      responseCompleted = true
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (value) {
        buffer += decoder.decode(value, { stream: true })
      }

      const parts = buffer.replace(/\r\n/g, '\n').split('\n\n')
      const remaining = buffer.endsWith('\n\n') ? '' : parts.pop() || ''
      buffer = remaining

      for (const part of parts.filter(Boolean)) {
        let eventData = ''
        for (const line of part.split('\n')) {
          if (line.startsWith('data: ')) {
            eventData += line.slice(6)
          }
        }

        consumeEventData(eventData)

        if (responseCompleted && latestImagePayload) {
          return latestImagePayload
        }
      }

      if (done) {
        break
      }
    }

    if (buffer.trim()) {
      let eventData = ''
      for (const line of buffer.split('\n')) {
        if (line.startsWith('data: ')) {
          eventData += line.slice(6)
        }
      }

      consumeEventData(eventData)
    }

    if (latestImagePayload) {
      return latestImagePayload
    }
  } finally {
    try {
      await reader.cancel()
    } catch {
      // Ignore reader cancel errors
    }
  }

  if (collectedText.trim()) {
    return { textResponse: collectedText.trim() }
  }

  throw new Error('未从响应中提取到图片。')
}

export async function requestImage(
  snapshot: GenerationSnapshot,
  onUpdate: (update: StreamUpdate) => void,
  signal: AbortSignal
): Promise<ImageResultPayload> {
  const hasReferences = snapshot.references.length > 0

  onUpdate({
    responseMessage: hasReferences
      ? '正在请求 /v1/images/edits'
      : '正在请求 /v1/images/generations',
  })

  if (hasReferences) {
    return await requestImagesEdit(snapshot, signal)
  }

  return await requestImagesGeneration(snapshot, signal)
}
