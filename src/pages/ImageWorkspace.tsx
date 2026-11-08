import { useState, useRef } from 'react'
import type { LibraryItem } from '@/types/image'
import { getBatchElapsedMs } from '@/lib/format'

// Custom Hooks
import { useProviders } from '@/hooks/useProviders'
import { useCloudStorage } from '@/hooks/useCloudStorage'
import { useReferenceImages } from '@/hooks/useReferenceImages'
import { useImageLibrary } from '@/hooks/useImageLibrary'
import { useImageGeneration } from '@/hooks/useImageGeneration'
import { useImagePreview } from '@/hooks/useImagePreview'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { useGenerationOptions } from '@/hooks/useGenerationOptions'

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
import { ParamsTab } from '@/components/image-workspace/control-panel/ParamsTab'
import { ReferenceTab } from '@/components/image-workspace/control-panel/ReferenceTab'
import { QueueTab } from '@/components/image-workspace/control-panel/QueueTab'
import { PromptComposer } from '@/components/image-workspace/PromptComposer'
import { ImageLibrary } from '@/components/image-workspace/ImageLibrary'
import { WorkspaceDialogs } from '@/components/image-workspace/WorkspaceDialogs'

// Lucide Icons
import { SlidersHorizontal, ChevronRight } from 'lucide-react'

export function ImageWorkspace() {
  // Global Confirmation Alert Dialog State
  const { confirmDialog, requestConfirm, closeConfirm } = useConfirmDialog()

  // Tab & Drawer State
  const [sidebarTab, setSidebarTab] = useState<'params' | 'reference' | 'queue'>('params')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false)

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Domain Hooks
  const providersControl = useProviders()
  const storageControl = useCloudStorage()
  const optionsControl = useGenerationOptions(providersControl.selectedProvider.outputFormat)
  const imagesControl = useReferenceImages(() => {
    setSidebarTab('reference')
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileSidebarOpen(true)
    }
  })
  const libraryControl = useImageLibrary({ requestConfirm })
  const generationControl = useImageGeneration()

  // Single source of truth for preview derived from library
  const previewControl = useImagePreview({
    library: libraryControl.library,
    filteredItems: libraryControl.filteredLibrary,
  })

  // Start generation with unified auto-cloud-backup
  const handleStartGeneration = async () => {
    setSidebarTab('queue')
    await generationControl.startBatchGeneration({
      provider: providersControl.selectedProvider,
      prompt: optionsControl.prompt,
      quality: optionsControl.quality,
      outputFormat: optionsControl.outputFormat,
      sizeTier: optionsControl.sizeTier,
      aspectRatio: optionsControl.aspectRatio,
      batchCount: optionsControl.batchCount,
      parallelCount: optionsControl.parallelCount,
      references: imagesControl.referenceImages,
      onOpenProviderDialog: providersControl.openProviderDialog,
      onJobSuccess: (item) => {
        libraryControl.addLibraryItem(item)

        // Automatic Cloud Storage Sync (unified in hook)
        storageControl.uploadAuto(item).then((metadata) => {
          if (metadata) {
            libraryControl.updateLibraryItem(item.id, metadata)
          }
        })
      },
    })
  }

  // Manual Cloud Uploads using unified metadata
  const handleUploadSingleToCloud = async (item: LibraryItem) => {
    const metadata = await storageControl.uploadSingle(item)
    if (metadata) {
      libraryControl.updateLibraryItem(item.id, metadata)
    }
  }

  const handleUploadSelectedToCloud = async () => {
    const items = libraryControl.library.filter((img) =>
      libraryControl.selectedImageIds.has(img.id)
    )
    if (items.length === 0) return

    const resultMap = await storageControl.uploadBatch(items)
    if (resultMap.size > 0) {
      libraryControl.updateBatchItems(resultMap)
    }
  }

  // Reuse images as reference
  const handleReuse = (ids: string[]) => {
    const selected = libraryControl.library.filter((item) => ids.includes(item.id))
    imagesControl.addReferences(
      selected.map((item) => ({ id: item.id, dataUrl: item.imageDataUrl }))
    )
  }

  // Studio Control Panel Element composed cleanly via children slots
  const studioPanelContent = (
    <StudioControlPanel
      activeTab={sidebarTab}
      onTabChange={setSidebarTab}
      referenceCount={imagesControl.referenceImages.length}
      isGenerating={generationControl.isGenerating}
      params={
        <ParamsTab
          providers={providersControl.providers}
          selectedProviderId={providersControl.selectedProviderId}
          onSelectProvider={providersControl.selectActiveProvider}
          onOpenProviderDialog={() => {
            setIsMobileSidebarOpen(false)
            providersControl.openProviderDialog()
          }}
          aspectRatio={optionsControl.aspectRatio}
          onAspectRatioChange={optionsControl.setAspectRatio}
          availableAspectRatios={optionsControl.availableAspectRatios}
          sizeTier={optionsControl.sizeTier}
          onSizeTierChange={optionsControl.setSizeTier}
          quality={optionsControl.quality}
          onQualityChange={optionsControl.setQuality}
          outputFormat={optionsControl.outputFormat}
          onOutputFormatChange={optionsControl.setOutputFormat}
          batchCount={optionsControl.batchCount}
          onBatchCountChange={optionsControl.setBatchCount}
          parallelCount={optionsControl.parallelCount}
          onParallelCountChange={optionsControl.setParallelCount}
        />
      }
      reference={
        <ReferenceTab
          references={imagesControl.referenceImages}
          onRemoveReference={imagesControl.removeReference}
          onClearReferences={imagesControl.clearReferences}
          onFileInputClick={() => fileInputRef.current?.click()}
          onFilesDrop={imagesControl.handleFiles}
        />
      }
      queue={
        <QueueTab
          batchStats={generationControl.batchStats}
          focusedBatchId={generationControl.focusedBatchId}
          batchJobs={generationControl.batchJobs}
          isGenerating={generationControl.isGenerating}
        />
      }
    />
  )

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative mx-auto max-w-[1560px] px-3.5 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-5">
        {/* Workspace Clean Top Toolbar Header */}
        <WorkspaceHeader
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          referencesCount={imagesControl.referenceImages.length}
          onApplyPromptPreset={optionsControl.setPrompt}
          onOpenProviderDialog={providersControl.openProviderDialog}
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
            batchCount={optionsControl.batchCount}
            parallelCount={optionsControl.parallelCount}
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
              prompt={optionsControl.prompt}
              onPromptChange={optionsControl.setPrompt}
              onGenerate={handleStartGeneration}
              onStop={generationControl.stopActiveBatch}
              isGenerating={generationControl.isGenerating}
              referencesCount={imagesControl.referenceImages.length}
              batchCount={optionsControl.batchCount}
            />

            <ImageLibrary
              totalCount={libraryControl.library.length}
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
              onDeleteSelected={libraryControl.deleteSelected}
              onDeleteSingle={(id) => libraryControl.deleteSelected([id])}
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
          onProviderDialogChange={(open) =>
            open ? providersControl.openProviderDialog() : providersControl.closeProviderDialog()
          }
          providers={providersControl.providers}
          providerForm={providersControl.providerDraft}
          onSelectDraftProvider={providersControl.selectDraftProvider}
          onUpdateProviderForm={providersControl.setProviderDraft}
          onSaveProvider={() => providersControl.saveProviderDraft(providersControl.providerDraft)}
          onNewProvider={providersControl.createNewProviderDraft}
          onDeleteProvider={() => providersControl.deleteOrDiscardDraft(requestConfirm)}
          isDraftNew={providersControl.isDraftNew}
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
          onCloseConfirmDialog={closeConfirm}
        />
      </div>
    </TooltipProvider>
  )
}
