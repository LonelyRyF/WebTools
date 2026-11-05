import type { GenerationJob } from '@/types/image'
import { describeResponseStatus } from './api'

export function truncate(value?: string, maxLength = 80): string {
  if (!value) return ''
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

export function formatDate(isoString?: string): string {
  if (!isoString) return ''
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString))
  } catch {
    return isoString
  }
}

export function parseTimestamp(value?: string): number {
  const timestamp = new Date(value || '').getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor((durationMs || 0) / 1000))

  if (totalSeconds < 60) {
    return `${totalSeconds} 秒`
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours} 小时 ${String(minutes).padStart(2, '0')} 分 ${String(seconds).padStart(2, '0')} 秒`
  }

  return `${minutes} 分 ${String(seconds).padStart(2, '0')} 秒`
}

export function getJobElapsedMs(job: GenerationJob): number {
  if (!job?.startedAt) return 0
  const startedAt = parseTimestamp(job.startedAt)
  const endedAt = parseTimestamp(job.completedAt) || Date.now()
  return startedAt > 0 ? Math.max(0, endedAt - startedAt) : 0
}

export function getBatchElapsedMs(jobs: GenerationJob[]): number {
  const startCandidates = jobs
    .map((job) => parseTimestamp(job.startedAt || job.createdAt))
    .filter(Boolean)

  if (startCandidates.length === 0) return 0

  const startedAt = Math.min(...startCandidates)
  const isActive = jobs.some((job) => job.status === 'running' || job.status === 'queued')
  const endCandidates = jobs
    .map((job) => parseTimestamp(job.completedAt || job.startedAt || job.createdAt))
    .filter(Boolean)
  const endedAt = isActive ? Date.now() : Math.max(...endCandidates, startedAt)

  return Math.max(0, endedAt - startedAt)
}

export function getJobDurationText(job: GenerationJob): string {
  if (!job?.startedAt) return ''
  return `${job.status === 'running' ? '已耗时' : '耗时'} ${formatDuration(getJobElapsedMs(job))}`
}

export function getJobResponseSummary(job: GenerationJob): string {
  const parts: string[] = []

  if (job.responseStatus) {
    parts.push(`响应 ${job.responseStatus}`)
  }

  const responseStatusLabel = describeResponseStatus(job.responseStatus || '')
  if (
    job.responseMessage &&
    job.responseMessage !== responseStatusLabel &&
    job.responseMessage !== `响应${responseStatusLabel}`
  ) {
    parts.push(job.responseMessage)
  }

  const durationText = getJobDurationText(job)
  if (durationText) {
    parts.push(durationText)
  }

  return parts.join(' · ')
}

export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}
