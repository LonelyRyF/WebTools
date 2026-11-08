import type { LibraryItem } from '@/types/image'
import { formatDate, downloadLibraryItem } from '@/lib/format'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Star, Share2, Download, Trash2, Cloud, CloudUpload } from 'lucide-react'

interface ImageCardProps {
  item: LibraryItem
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onToggleFavorite: (id: string) => void
  onOpenPreview: (id: string) => void
  onReuse: (id: string) => void
  onDelete: (id: string) => void
  onUploadToCloud?: (item: LibraryItem) => void
  isCloudConfigured?: boolean
}

export function ImageCard({
  item,
  isSelected,
  onToggleSelect,
  onToggleFavorite,
  onOpenPreview,
  onReuse,
  onDelete,
  onUploadToCloud,
  isCloudConfigured,
}: ImageCardProps) {
  return (
    <Card
      className={`group relative flex flex-col justify-between overflow-hidden transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
    >
      {/* Media Box */}
      <div
        onClick={() => onOpenPreview(item.id)}
        className="relative aspect-4/5 cursor-zoom-in overflow-hidden bg-muted shrink-0"
      >
        <img
          src={item.imageDataUrl}
          alt={item.prompt}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-103"
        />

        {/* Checkbox overlay */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-1.5 left-1.5 z-10 rounded-md bg-background/85 p-1.5 backdrop-blur-xs sm:top-2 sm:left-2 sm:p-1"
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(item.id)}
            aria-label="选择图片"
          />
        </div>

        {/* Cloud badge indicator */}
        {item.cloudUrl && (
          <div
            className="absolute bottom-1.5 left-1.5 z-10 flex items-center gap-1 rounded-md bg-background/85 px-1.5 py-0.5 text-[9px] font-medium text-indigo-600 shadow-xs backdrop-blur-xs dark:text-indigo-400"
            title={`已上传至 ${item.cloudStorageType?.toUpperCase() || '云端'}`}
          >
            <Cloud className="size-2.5" />
            <span className="hidden sm:inline">云端</span>
          </div>
        )}

        {/* Favorite button */}
        <Button
          type="button"
          variant="secondary"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(item.id)
          }}
          className={`absolute top-1.5 right-1.5 z-10 size-7.5 rounded-full bg-background/85 shadow-xs backdrop-blur-xs transition-colors sm:top-2 sm:right-2 sm:size-7 ${
            item.favorite ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="收藏图片"
        >
          <Star className={`size-3.5 ${item.favorite ? 'fill-current' : ''}`} />
        </Button>
      </div>

      {/* Card Info - wrapped with min-w-0 and break-words to ensure long prompts never break widgets */}
      <div className="flex flex-1 flex-col justify-between p-2 space-y-1.5 sm:p-2.5 min-w-0">
        <div className="space-y-1.5 min-w-0">
          <p
            className="line-clamp-2 text-xs font-medium leading-snug text-foreground break-words break-all"
            title={item.prompt || '未命名图片'}
          >
            {item.prompt || '未命名图片'}
          </p>

          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="h-4 px-1 text-[9px]">
              {item.size || 'auto'}
            </Badge>
            <Badge variant="secondary" className="h-4 px-1 text-[9px]">
              {item.quality || 'auto'}
            </Badge>
            <Badge variant="outline" className="h-4 px-1 text-[9px]">
              {item.sourceType === 'edited' ? '编辑图' : '生成图'}
            </Badge>
          </div>
        </div>

        {/* Bottom action controls - shrink-0 to prevent squishing */}
        <div className="flex items-center justify-between border-t pt-1.5 text-muted-foreground min-w-0">
          <span
            className="text-[10px] truncate max-w-[60px] sm:max-w-[75px] shrink min-w-0"
            title={formatDate(item.createdAt)}
          >
            {formatDate(item.createdAt)}
          </span>

          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onReuse(item.id)}
              className="h-6 px-1 text-[10px] sm:px-1.5"
              title="设为参考图"
            >
              <Share2 className="size-3 sm:hidden" />
              <span className="hidden sm:inline">复用</span>
            </Button>

            <Button
              variant="ghost"
              size="xs"
              onClick={() => downloadLibraryItem(item)}
              className="h-6 px-1 text-[10px] sm:px-1.5"
              title="下载"
            >
              <Download className="size-3 sm:hidden" />
              <span className="hidden sm:inline">下载</span>
            </Button>

            {isCloudConfigured && onUploadToCloud && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onUploadToCloud(item)}
                className={`h-6 px-1 text-[10px] sm:px-1.5 ${
                  item.cloudUrl ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground hover:text-foreground'
                }`}
                title={item.cloudUrl ? '已备份至云端（点击重新上传）' : '上传到云存储 (S3 / WebDAV)'}
              >
                <CloudUpload className="size-3" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="xs"
              onClick={() => onDelete(item.id)}
              className="h-6 px-1 text-[10px] text-destructive hover:bg-destructive/10 hover:text-destructive sm:px-1.5"
              title="删除"
            >
              <Trash2 className="size-3 sm:hidden" />
              <span className="hidden sm:inline">删除</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
