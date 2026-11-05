import type {
  ProviderConfig,
  ReferenceImage,
  GenerationJob,
  QualityTier,
  SizeTier,
  OutputFormat,
} from '@/types/image'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sliders, ImageIcon, ListOrdered, Loader2 } from 'lucide-react'
import { ParamsTab } from './control-panel/ParamsTab'
import { ReferenceTab } from './control-panel/ReferenceTab'
import { QueueTab } from './control-panel/QueueTab'

interface StudioControlPanelProps {
  sidebarTab: 'params' | 'reference' | 'queue'
  onTabChange: (tab: 'params' | 'reference' | 'queue') => void
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
  references: ReferenceImage[]
  onRemoveReference: (id: string) => void
  onClearReferences: () => void
  onFileInputClick: () => void
  onFilesDrop: (files: FileList) => void
  batchStats: {
    total: number
    running: number
    success: number
    error: number
    finished: number
    queued: number
  }
  focusedBatchId: string | null
  batchJobs: GenerationJob[]
  isGenerating: boolean
}

export function StudioControlPanel(props: StudioControlPanelProps) {
  const {
    sidebarTab,
    onTabChange,
    references,
    isGenerating,
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
    onRemoveReference,
    onClearReferences,
    onFileInputClick,
    onFilesDrop,
    batchStats,
    focusedBatchId,
    batchJobs,
  } = props

  return (
    <Card className="border-border/80 bg-card shadow-xs lg:sticky lg:top-16">
      <Tabs
        value={sidebarTab}
        onValueChange={(val) => onTabChange(val as 'params' | 'reference' | 'queue')}
        className="w-full"
      >
        <CardHeader className="p-3 pb-2 border-b">
          <TabsList className="w-full grid grid-cols-3 h-8">
            <TabsTrigger value="params" className="gap-1.5 text-xs h-6.5">
              <Sliders className="size-3.5" />
              参数
            </TabsTrigger>
            <TabsTrigger value="reference" className="gap-1.5 text-xs h-6.5">
              <ImageIcon className="size-3.5" />
              参考 ({references.length})
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-1.5 text-xs h-6.5">
              <ListOrdered className="size-3.5" />
              队列 {isGenerating && <Loader2 className="size-3 animate-spin text-blue-500" />}
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent className="p-3.5 pt-3">
          <TabsContent value="params" className="mt-0 outline-none">
            <ParamsTab
              providers={providers}
              selectedProviderId={selectedProviderId}
              onSelectProvider={onSelectProvider}
              onOpenProviderDialog={onOpenProviderDialog}
              aspectRatio={aspectRatio}
              onAspectRatioChange={onAspectRatioChange}
              availableAspectRatios={availableAspectRatios}
              sizeTier={sizeTier}
              onSizeTierChange={onSizeTierChange}
              quality={quality}
              onQualityChange={onQualityChange}
              outputFormat={outputFormat}
              onOutputFormatChange={onOutputFormatChange}
              batchCount={batchCount}
              onBatchCountChange={onBatchCountChange}
              parallelCount={parallelCount}
              onParallelCountChange={onParallelCountChange}
            />
          </TabsContent>

          <TabsContent value="reference" className="mt-0 outline-none">
            <ReferenceTab
              references={references}
              onRemoveReference={onRemoveReference}
              onClearReferences={onClearReferences}
              onFileInputClick={onFileInputClick}
              onFilesDrop={onFilesDrop}
            />
          </TabsContent>

          <TabsContent value="queue" className="mt-0 outline-none">
            <QueueTab
              batchStats={batchStats}
              focusedBatchId={focusedBatchId}
              batchJobs={batchJobs}
              isGenerating={isGenerating}
            />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
