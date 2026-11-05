import { useState, useMemo, useCallback, useRef } from 'react'
import type { QualityTier, SizeTier, OutputFormat, LibraryItem } from '@/types/image'
import { aspectRatioMap } from '@/lib/api'
import { downloadImage, getBatchElapsedMs } from '@/lib/format'
import { uploadImageToStorage } from '@/lib/storage'

// Custom Hooks
import { useProviders } from '@/hooks/useProviders'
import { useCloudStorage } from '@/hooks/useCloudStorage'
import { useReferenceImages } from '@/hooks/useReferenceImages'
import { useImageLibrary } from '@/hooks/useImageLibrary'
import { useImageGeneration } from '@/hooks/useImageGeneration'
import { useImagePreview } from '@/hooks/useImagePreview'

// Shadcn UI Components
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { TooltipProvider } from '@/components/ui/tooltip'

// Modular Workspace Components
import { WorkspaceHeader } from '@/components/image-workspace/WorkspaceHeader'
import { BatchProgressBanner } from '@/components/image-workspace/BatchProgressBanner'
import { StudioControlPanel } from '@/components/image-workspace/StudioControlPanel'
import { PromptComposer } from '@/components/image-workspace/PromptComposer'
import { ImageLibrary } from '@/components/image-workspace/ImageLibrary'
import {
  WorkspaceDialogs,
  type ConfirmDialogState,
} from '@/components/image-workspace/WorkspaceDialogs'

// Lucide Icons
import { SlidersHorizontal, ChevronRight } from 'lucide-react'

export function ImageWorkspace({
  onRegisterClear,
}: {
  onRegisterClear?: (cb: () => void) => void
}) {
  // Global Confirmation Alert Dialog State
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: '确认',
    variant: 'default',
    action: () => {},
  })

  const requestConfirm = useCallback(
    (
      title: string,
      description: string,
      action: () => void,
      variant: 'default' | 'destructive' = 'default'
    ) => {
      setConfirmDialog({
        isOpen: true,
        title,
        description,
        confirmText: variant === 'destructive' ? '确认删除' : '确认',
        variant,
        action,
      })
    },
    []
  )

  // Generation Options State
  const [prompt, setPrompt] = useState<string>('')
  const [quality, setQuality] = useState<QualityTier>('auto')
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png')
  const [sizeTier, setSizeTier] = useState<SizeTier>('auto')
  const [aspectRatio, setAspectRatio] = useState<string>('1:1')
  const [batchCount, setBatchCount] = useState<number>(4)
  const [parallelCount, setParallelCount] = useState<number>(2)
  const [sidebarTab, setSidebarTab] = useState<'params' | 'reference' | 'queue'>('params')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false)

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Domain Hooks
  const providersControl = useProviders(outputFormat)
  const storageControl = useCloudStorage()
  const imagesControl = useReferenceImages(() => {
    setSidebarTab('reference')
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileSidebarOpen(true)
    }
  })
  const libraryControl = useImageLibrary({ onRegisterClear, requestConfirm })
  const generationControl = useImageGeneration()
  const previewControl = useImagePreview(libraryControl.filteredLibrary)

  // Aspect ratio synchronization when size tier changes
  const availableAspectRatios = useMemo(() => {
    return aspectRatioMap[sizeTier] || aspectRatioMap.auto
  }, [sizeTier])

  const handleSizeTierChange = (newTier: SizeTier) => {
    setSizeTier(newTier)
    const ratios = aspectRatioMap[newTier] || aspectRatioMap.auto
    if (!ratios.includes(aspectRatio)) {
      setAspectRatio(ratios[0] || '1:1')
    }
  }

  // Generation Trigger with Auto-cloud-backup
  const handleStartGeneration = async () => {
    setSidebarTab('queue')
    await generationControl.startBatchGeneration({
      provider: providersControl.providerForm,
      prompt,
      quality,
      outputFormat,
      sizeTier,
      aspectRatio,
      batchCount,
      parallelCount,
      references: imagesControl.referenceImages,
      onOpenProviderDialog: () => providersControl.setIsProviderDialogOpen(true),
      onJobSuccess: (item) => {
        libraryControl.addLibraryItem(item)

        // Automatic Cloud Storage Sync if enabled
        const cfg = storageControl.storageConfig
        if (cfg.type !== 'local' && cfg.autoUpload) {
          uploadImageToStorage(item, cfg)
            .then((res) => {
              if (res.success && res.url) {
                libraryControl.updateLibraryItem(item.id, {
                  cloudUrl: res.url,
                  cloudStorageType: cfg.type as 's3' | 'webdav',
                  cloudUploadedAt: new Date().toISOString(),
                })
              }
            })
            .catch((err) => console.warn('Auto upload error:', err))
        }
      },
    })
  }

  // Manual Cloud Uploads
  const handleUploadSingleToCloud = async (item: LibraryItem) => {
    const url = await storageControl.uploadSingle(item)
    if (url) {
      const updates = {
        cloudUrl: url,
        cloudStorageType: storageControl.storageConfig.type as 's3' | 'webdav',
        cloudUploadedAt: new Date().toISOString(),
      }
      libraryControl.updateLibraryItem(item.id, updates)
      if (previewControl.previewItem?.id === item.id) {
        previewControl.updatePreviewItem(updates)
      }
    }
  }

  const handleUploadSelectedToCloud = async () => {
    const items = libraryControl.library.filter((img) =>
      libraryControl.selectedImageIds.has(img.id)
    )
    if (items.length === 0) return

    const resultMap = await storageControl.uploadBatch(items)
    if (resultMap.size > 0) {
      const updatesMap = new Map<string, Partial<LibraryItem>>()
      resultMap.forEach((url, id) => {
        updatesMap.set(id, {
          cloudUrl: url,
          cloudStorageType: storageControl.storageConfig.type as 's3' | 'webdav',
          cloudUploadedAt: new Date().toISOString(),
        })
      })
      libraryControl.updateBatchItems(updatesMap)
    }
  }

  // Reuse images as reference
  const handleReuse = (ids: string[]) => {
    const selected = libraryControl.library.filter((item) => ids.includes(item.id))
    imagesControl.addReferences(
      selected.map((item) => ({ id: item.id, dataUrl: item.imageDataUrl }))
    )
  }

  // Studio Control Panel Element (shared between desktop sidebar & mobile drawer)
  const studioPanelContent = (
    <StudioControlPanel
      sidebarTab={sidebarTab}
      onTabChange={setSidebarTab}
      providers={providersControl.providers}
      selectedProviderId={providersControl.selectedProviderId}
      onSelectProvider={(id) => providersControl.handleSelectProvider(id, setOutputFormat)}
      onOpenProviderDialog={() => {
        setIsMobileSidebarOpen(false)
        providersControl.setIsProviderDialogOpen(true)
      }}
      aspectRatio={aspectRatio}
      onAspectRatioChange={setAspectRatio}
      availableAspectRatios={availableAspectRatios}
      sizeTier={sizeTier}
      onSizeTierChange={handleSizeTierChange}
      quality={quality}
      onQualityChange={setQuality}
      outputFormat={outputFormat}
      onOutputFormatChange={setOutputFormat}
      batchCount={batchCount}
      onBatchCountChange={setBatchCount}
      parallelCount={parallelCount}
      onParallelCountChange={setParallelCount}
      references={imagesControl.referenceImages}
      onRemoveReference={imagesControl.removeReference}
      onClearReferences={imagesControl.clearReferences}
      onFileInputClick={() => fileInputRef.current?.click()}
      onFilesDrop={imagesControl.handleFiles}
      batchStats={generationControl.batchStats}
      focusedBatchId={generationControl.focusedBatchId}
      batchJobs={generationControl.batchJobs}
      isGenerating={generationControl.isGenerating}
    />
  )

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative mx-auto max-w-[1560px] px-3.5 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-5">
        {/* Workspace Clean Top Toolbar Header */}
        <WorkspaceHeader
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          referencesCount={imagesControl.referenceImages.length}
          onApplyPromptPreset={(p) => setPrompt(p)}
          onOpenProviderDialog={() => providersControl.setIsProviderDialogOpen(true)}
          onOpenStorageDialog={() => storageControl.setIsStorageDialogOpen(true)}
          storageType={storageControl.storageConfig.type}
          onClearLibrary={libraryControl.clearLibrary}
          libraryCount={libraryControl.library.length}
        />

        <Separator />

        {/* Active Generation Banner */}
        {generationControl.isGenerating && (
          <BatchProgressBanner
            focusedBatchId={generationControl.focusedBatchId}
            batchCount={batchCount}
            parallelCount={parallelCount}
            batchStats={generationControl.batchStats}
            elapsedMs={getBatchElapsedMs(generationControl.batchJobs)}
            onStop={generationControl.stopActiveBatch}
          />
        )}

        {/* Mobile Quick Parameter Bar */}
        <div className="flex items-center justify-between rounded-lg border bg-card/60 px-3 py-2 text-xs lg:hidden">
          <span className="text-muted-foreground text-xs">
            {generationControl.batchStats.running > 0
              ? `正在执行批次任务 (${generationControl.batchStats.finished}/${generationControl.batchStats.total})`
              : '生成参数与参考图'}
          </span>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="gap-1 text-xs text-primary hover:text-primary h-6 px-1.5"
          >
            <span>打开控制面板</span>
            <ChevronRight className="size-3" />
          </Button>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] gap-4 sm:gap-5 items-start">
          <div className="hidden lg:block lg:sticky lg:top-16">
            {studioPanelContent}
          </div>

          <div className="space-y-4 min-w-0">
            <PromptComposer
              prompt={prompt}
              onPromptChange={setPrompt}
              onGenerate={handleStartGeneration}
              onStop={generationControl.stopActiveBatch}
              isGenerating={generationControl.isGenerating}
              referencesCount={imagesControl.referenceImages.length}
              batchCount={batchCount}
            />

            <ImageLibrary
              library={libraryControl.library}
              filteredItems={libraryControl.filteredLibrary}
              selectedImageIds={libraryControl.selectedImageIds}
              filter={libraryControl.filter}
              onFilterChange={libraryControl.setFilter}
              search={libraryControl.search}
              onSearchChange={libraryControl.setSearch}
              sort={libraryControl.sort}
              onSortChange={libraryControl.setSort}
              onToggleSelectAll={libraryControl.toggleSelectVisible}
              isAllSelected={libraryControl.allVisibleSelected}
              onToggleSelect={libraryControl.toggleSelect}
              onToggleFavorite={libraryControl.toggleFavorite}
              onOpenPreview={previewControl.openPreview}
              onReuse={handleReuse}
              onDownloadSelected={libraryControl.downloadSelected}
              onDeleteSelected={(ids) =>
                libraryControl.deleteSelected(ids, (deleted) => {
                  if (previewControl.previewItem && deleted.has(previewControl.previewItem.id)) {
                    previewControl.closePreview()
                  }
                })
              }
              onDownloadSingle={downloadImage}
              onDeleteSingle={(id) =>
                libraryControl.deleteSelected([id], () => {
                  if (previewControl.previewItem?.id === id) {
                    previewControl.closePreview()
                  }
                })
              }
              isCloudConfigured={storageControl.storageConfig.type !== 'local'}
              onUploadSelectedToCloud={handleUploadSelectedToCloud}
              onUploadSingleToCloud={handleUploadSingleToCloud}
            />
          </div>
        </div>

        {/* Mobile Control Sheet Drawer */}
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent side="left" className="w-[340px] sm:w-[380px] p-0 flex flex-col">
            <SheetHeader className="p-4 pb-2 border-b">
              <SheetTitle className="text-sm font-semibold flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-primary" />
                控制面板
              </SheetTitle>
              <SheetDescription className="text-xs">
                调整生成参数、管理参考图与查看批次执行队列
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1 p-3">
              {studioPanelContent}
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Hidden File Upload Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files) imagesControl.handleFiles(e.target.files)
            e.target.value = ''
          }}
          accept="image/*"
          multiple
          className="hidden"
        />

        {/* All Modals & Dialogs Unified */}
        <WorkspaceDialogs
          isProviderDialogOpen={providersControl.isProviderDialogOpen}
          onProviderDialogChange={providersControl.setIsProviderDialogOpen}
          providers={providersControl.providers}
          selectedProviderId={providersControl.selectedProviderId}
          onSelectProvider={(id) => providersControl.handleSelectProvider(id, setOutputFormat)}
          providerForm={providersControl.providerForm}
          onUpdateProviderForm={providersControl.setProviderForm}
          onSaveProvider={() => providersControl.handleSaveProvider(outputFormat)}
          onNewProvider={providersControl.handleNewProvider}
          onDeleteProvider={() => providersControl.handleDeleteProvider(requestConfirm)}
          isStorageDialogOpen={storageControl.isStorageDialogOpen}
          onStorageDialogChange={storageControl.setIsStorageDialogOpen}
          storageConfig={storageControl.storageConfig}
          onSaveStorageConfig={storageControl.handleSaveConfig}
          previewItem={previewControl.previewItem}
          onClosePreview={previewControl.closePreview}
          onNavigatePreview={previewControl.navigatePreview}
          previewIndex={previewControl.previewIndex}
          totalCount={libraryControl.filteredLibrary.length}
          onReuseImage={(id) => handleReuse([id])}
          onUploadToCloud={handleUploadSingleToCloud}
          confirmDialog={confirmDialog}
          onCloseConfirmDialog={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    </TooltipProvider>
  )
}
