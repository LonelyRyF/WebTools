import type { ReferenceImage } from '@/types/image'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'

interface ReferenceTabProps {
  references: ReferenceImage[]
  onRemoveReference: (id: string) => void
  onClearReferences: () => void
  onFileInputClick: () => void
  onFilesDrop: (files: FileList) => void
}

export function ReferenceTab({
  references,
  onRemoveReference,
  onClearReferences,
  onFileInputClick,
  onFilesDrop,
}: ReferenceTabProps) {
  return (
    <div className="space-y-3 mt-0 outline-none">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files) onFilesDrop(e.dataTransfer.files)
        }}
        onClick={onFileInputClick}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-muted/20 p-3 text-center transition-colors hover:bg-muted/50 sm:p-4"
      >
        <Upload className="size-5 text-muted-foreground" />
        <p className="mt-1 text-xs font-medium text-foreground">点击或拖拽图片到此</p>
        <p className="text-[10px] text-muted-foreground">支持手机相册上传或截图粘贴</p>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">
          参考图 ({references.length})
        </span>
        {references.length > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onClearReferences}
            className="h-5 text-destructive hover:text-destructive"
          >
            清空
          </Button>
        )}
      </div>

      {references.length === 0 ? (
        <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
          未添加参考图，将以纯文本提示词进行全新生成。
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {references.map((item) => (
            <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <img src={item.dataUrl} alt={item.name} className="size-full object-cover" />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onRemoveReference(item.id)}
                className="absolute top-1 right-1 size-5 rounded-full bg-black/75 text-white opacity-90 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 hover:bg-black/90 hover:text-white"
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
