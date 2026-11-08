import { useState } from 'react'
import type { LibraryItem } from '@/types/image'
import { formatDate, downloadLibraryItem } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  Copy,
  Check,
  Cloud,
  CloudUpload,
  ExternalLink,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

interface ImagePreviewDialogProps {
  item: LibraryItem | null
  onClose: () => void
  onNavigate: (step: number) => void
  currentIndex: number
  totalCount: number
  onReuse: (id: string) => void
  onUploadToCloud?: (item: LibraryItem) => void
  isCloudConfigured?: boolean
}

export function ImagePreviewDialog({
  item,
  onClose,
  onNavigate,
  currentIndex,
  totalCount,
  onReuse,
  onUploadToCloud,
  isCloudConfigured,
}: ImagePreviewDialogProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const handleCopyPrompt = () => {
    if (!item?.prompt) return
    navigator.clipboard.writeText(item.prompt)
    setCopiedPrompt(true)
    toast.success('提示词已复制到剪贴板')
    setTimeout(() => setCopiedPrompt(false), 1800)
  }

  const handleCopyCloudUrl = () => {
    if (!item?.cloudUrl) return
    navigator.clipboard.writeText(item.cloudUrl)
    setCopiedUrl(true)
    toast.success('云端直链已复制到剪贴板')
    setTimeout(() => setCopiedUrl(false), 1800)
  }

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] max-w-5xl sm:max-w-4xl md:max-w-5xl lg:max-w-5xl p-0 overflow-hidden sm:h-[680px] sm:max-h-[88vh]"
      >
        <DialogTitle className="sr-only">图片预览与详情</DialogTitle>
        {item && (
          <div className="grid h-full grid-cols-1 sm:grid-cols-[1fr_360px] overflow-hidden">
            {/* Left Media viewer - abundant space to display the full image */}
            <div className="relative flex min-h-[260px] max-h-[46vh] sm:max-h-full sm:h-full items-center justify-center bg-black/95 p-3 sm:p-6 overflow-hidden select-none">
              <img
                src={item.imageDataUrl}
                alt={item.prompt}
                className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-md"
              />

              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => onNavigate(-1)}
                disabled={currentIndex <= 0}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 size-8.5 sm:size-9 rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/40 hover:text-white disabled:opacity-20 transition-all shadow-md"
                aria-label="上一张图片"
              >
                <ChevronLeft className="size-4.5 sm:size-5" />
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => onNavigate(1)}
                disabled={currentIndex >= totalCount - 1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 size-8.5 sm:size-9 rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/40 hover:text-white disabled:opacity-20 transition-all shadow-md"
                aria-label="下一张图片"
              >
                <ChevronRight className="size-4.5 sm:size-5" />
              </Button>
            </div>

            {/* Right Sidebar detail - strictly bounded with internal scrolling and integrated close button */}
            <div className="flex flex-col h-full min-h-0 bg-card p-3.5 sm:p-5 overflow-hidden justify-between border-t sm:border-t-0 sm:border-l border-border/60">
              {/* Header section with integrated close button, preventing overlapping badges */}
              <div className="flex items-center justify-between shrink-0 pb-2.5 border-b">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="text-xs shrink-0">
                    {currentIndex + 1} / {totalCount}
                  </Badge>

                  {item.cloudUrl && (
                    <Badge
                      variant="outline"
                      className="border-indigo-500/30 text-indigo-600 dark:text-indigo-400 gap-1 text-[11px] truncate"
                      title={item.cloudUrl}
                    >
                      <Cloud className="size-3 shrink-0" />
                      <span className="truncate">已同步至 {item.cloudStorageType?.toUpperCase() || '云端'}</span>
                    </Badge>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={onClose}
                  className="size-7 rounded-md text-muted-foreground hover:text-foreground shrink-0 ml-2"
                  aria-label="关闭预览"
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Middle scrollable details area */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 pr-1 py-3 text-xs">
                {/* Prompt block with copy action and scrollable box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="font-semibold text-foreground text-xs">提示词 (Prompt)</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={handleCopyPrompt}
                      className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="size-3 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>复制提示词</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="rounded-lg border bg-muted/40 overflow-hidden">
                    <div className="max-h-36 sm:max-h-44 overflow-y-auto p-2.5 text-xs leading-relaxed text-foreground break-words break-all select-text font-normal">
                      {item.prompt || '未命名图片'}
                    </div>
                  </div>
                </div>

                {/* Metadata attributes */}
                <div className="space-y-1.5 rounded-lg border bg-muted/20 p-2.5 text-[11px] sm:text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">生成时间：</span>
                    <span className="font-mono">{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">模型配置：</span>
                    <span className="font-mono">{item.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">图像尺寸：</span>
                    <span className="font-mono">{item.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">画质档位：</span>
                    <span className="capitalize">{item.quality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">生成类型：</span>
                    <span>{item.sourceType === 'edited' ? '参考图编辑' : '纯文本生成'}</span>
                  </div>
                </div>

                {/* Cloud storage link info if uploaded */}
                {item.cloudUrl && (
                  <div className="rounded-lg border border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 p-2.5 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                        <Cloud className="size-3.5" />
                        云端直链
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={handleCopyCloudUrl}
                        className="h-5 px-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 gap-1 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40"
                      >
                        {copiedUrl ? <Check className="size-2.5 text-emerald-500" /> : <Copy className="size-2.5" />}
                        {copiedUrl ? '已复制' : '复制直链'}
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <a
                        href={item.cloudUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-[11px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline flex-1"
                        title={item.cloudUrl}
                      >
                        {item.cloudUrl}
                      </a>
                      <a
                        href={item.cloudUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 p-1 text-muted-foreground hover:text-foreground"
                        title="在新标签页中打开"
                      >
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom action controls - always pinned firmly at bottom */}
              <div className="shrink-0 border-t pt-3 space-y-2 mt-auto">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full gap-1.5 text-xs h-8.5 sm:h-9"
                    onClick={() => {
                      onReuse(item.id)
                      onClose()
                    }}
                  >
                    <Share2 className="size-3.5" />
                    设为参考图
                  </Button>
                  <Button
                    className="w-full gap-1.5 text-xs h-8.5 sm:h-9 font-medium"
                    onClick={() => downloadLibraryItem(item)}
                  >
                    <Download className="size-3.5" />
                    下载原图
                  </Button>
                </div>

                {/* Cloud sync button if cloud storage is configured */}
                {isCloudConfigured && onUploadToCloud && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full gap-1.5 text-xs h-8 border text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                    onClick={() => onUploadToCloud(item)}
                  >
                    <CloudUpload className="size-3.5" />
                    <span>{item.cloudUrl ? '重新同步至云存储' : '备份至云端 (S3 / WebDAV)'}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
