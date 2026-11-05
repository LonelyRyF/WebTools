import type {
  ProviderConfig,
  QualityTier,
  SizeTier,
  OutputFormat,
} from '@/types/image'
import { getSize } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Settings } from 'lucide-react'

interface ParamsTabProps {
  providers: ProviderConfig[]
  selectedProviderId: string
  onSelectProvider: (id: string) => void
  onOpenProviderDialog: () => void
  aspectRatio: string
  onAspectRatioChange: (ratio: string) => void
  availableAspectRatios: string[]
  sizeTier: SizeTier
  onSizeTierChange: (tier: SizeTier) => void
  quality: QualityTier
  onQualityChange: (q: QualityTier) => void
  outputFormat: OutputFormat
  onOutputFormatChange: (fmt: OutputFormat) => void
  batchCount: number
  onBatchCountChange: (cnt: number) => void
  parallelCount: number
  onParallelCountChange: (cnt: number) => void
}

export function ParamsTab({
  providers,
  selectedProviderId,
  onSelectProvider,
  onOpenProviderDialog,
  aspectRatio,
  onAspectRatioChange,
  availableAspectRatios,
  sizeTier,
  onSizeTierChange,
  quality,
  onQualityChange,
  outputFormat,
  onOutputFormatChange,
  batchCount,
  onBatchCountChange,
  parallelCount,
  onParallelCountChange,
}: ParamsTabProps) {
  return (
    <div className="space-y-3.5 mt-0 outline-none">
      {/* Provider Row */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">API 提供商</label>
          <Button
            variant="ghost"
            size="xs"
            onClick={onOpenProviderDialog}
            className="h-5 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-1"
          >
            <Settings className="size-3" />
            配置
          </Button>
        </div>
        <Select value={selectedProviderId} onValueChange={onSelectProvider}>
          <SelectTrigger className="w-full text-xs h-8">
            <SelectValue placeholder="选择 Provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-xs">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Aspect Ratio Buttons */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">宽高比</label>
          <span className="font-mono text-[11px] text-muted-foreground">{aspectRatio}</span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {['1:1', '16:9', '9:16', '3:2', '2:3'].map((ratio) => {
            const isAvailable = availableAspectRatios.includes(ratio)
            const isSelected = aspectRatio === ratio
            return (
              <Button
                key={ratio}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                disabled={!isAvailable}
                onClick={() => onAspectRatioChange(ratio)}
                className="h-7.5 px-0.5 text-[11px] sm:px-1 sm:text-xs"
              >
                {ratio}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Sizing & Quality */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">尺寸档位</label>
          <Select value={sizeTier} onValueChange={(val) => onSizeTierChange(val as SizeTier)}>
            <SelectTrigger className="w-full text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto" className="text-xs">Auto</SelectItem>
              <SelectItem value="1k" className="text-xs">1K 标清</SelectItem>
              <SelectItem value="2k" className="text-xs">2K 高清</SelectItem>
              <SelectItem value="4k" className="text-xs">4K 超清</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">画质级别</label>
          <Select value={quality} onValueChange={(val) => onQualityChange(val as QualityTier)}>
            <SelectTrigger className="w-full text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto" className="text-xs">Auto</SelectItem>
              <SelectItem value="low" className="text-xs">Low (快速)</SelectItem>
              <SelectItem value="medium" className="text-xs">Medium (平衡)</SelectItem>
              <SelectItem value="high" className="text-xs">High (精细)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Format & Resolution */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">输出格式</label>
          <Select value={outputFormat} onValueChange={(val) => onOutputFormatChange(val as OutputFormat)}>
            <SelectTrigger className="w-full text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png" className="text-xs">PNG</SelectItem>
              <SelectItem value="jpeg" className="text-xs">JPEG</SelectItem>
              <SelectItem value="webp" className="text-xs">WebP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">分辨率</label>
          <div className="flex h-8 items-center rounded-lg border bg-muted/40 px-2.5 font-mono text-xs text-foreground">
            {getSize(sizeTier, aspectRatio)}
          </div>
        </div>
      </div>

      {/* Batch count & Parallel execution */}
      <div className="grid grid-cols-2 gap-2.5 border-t pt-2.5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">生成数量</label>
          <Select value={String(batchCount)} onValueChange={(val) => onBatchCountChange(Number(val))}>
            <SelectTrigger className="w-full text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 6].map((num) => (
                <SelectItem key={num} value={String(num)} className="text-xs">
                  {num} 张
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">并发并发数</label>
          <Select value={String(parallelCount)} onValueChange={(val) => onParallelCountChange(Number(val))}>
            <SelectTrigger className="w-full text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 6].map((num) => (
                <SelectItem key={num} value={String(num)} className="text-xs">
                  {num} 线程
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
