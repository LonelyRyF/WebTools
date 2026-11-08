import type { ProviderConfig, LibraryItem } from '@/types/image'
import type { StorageConfig } from '@/types/storage'
import { ProviderDialog } from '@/components/image-workspace/ProviderDialog'
import { StorageDialog } from '@/components/image-workspace/StorageDialog'
import { ImagePreviewDialog } from '@/components/image-workspace/ImagePreviewDialog'
import { ConfirmDialog } from '@/components/image-workspace/ConfirmDialog'
import type { ConfirmDialogState } from '@/hooks/useConfirmDialog'

interface WorkspaceDialogsProps {
  // Provider Dialog
  isProviderDialogOpen: boolean
  onProviderDialogChange: (open: boolean) => void
  providers: ProviderConfig[]
  providerForm: ProviderConfig
  onSelectDraftProvider: (id: string) => void
  onUpdateProviderForm: (form: ProviderConfig) => void
  onSaveProvider: () => void
  onNewProvider: () => void
  onDeleteProvider: () => void
  isDraftNew?: boolean

  // Storage Dialog
  isStorageDialogOpen: boolean
  onStorageDialogChange: (open: boolean) => void
  storageConfig: StorageConfig
  onSaveStorageConfig: (cfg: StorageConfig) => void

  // Preview Dialog
  previewItem: LibraryItem | null
  onClosePreview: () => void
  onNavigatePreview: (step: number) => void
  previewIndex: number
  totalCount: number
  onReuseImage: (id: string) => void
  onUploadToCloud?: (item: LibraryItem) => void

  // Confirm Dialog
  confirmDialog: ConfirmDialogState
  onCloseConfirmDialog: () => void
}

export function WorkspaceDialogs({
  isProviderDialogOpen,
  onProviderDialogChange,
  providers,
  providerForm,
  onSelectDraftProvider,
  onUpdateProviderForm,
  onSaveProvider,
  onNewProvider,
  onDeleteProvider,
  isDraftNew,
  isStorageDialogOpen,
  onStorageDialogChange,
  storageConfig,
  onSaveStorageConfig,
  previewItem,
  onClosePreview,
  onNavigatePreview,
  previewIndex,
  totalCount,
  onReuseImage,
  onUploadToCloud,
  confirmDialog,
  onCloseConfirmDialog,
}: WorkspaceDialogsProps) {
  return (
    <>
      {/* Provider Settings Dialog */}
      <ProviderDialog
        open={isProviderDialogOpen}
        onOpenChange={onProviderDialogChange}
        providers={providers}
        providerForm={providerForm}
        onSelectDraftProvider={onSelectDraftProvider}
        onUpdateProviderForm={onUpdateProviderForm}
        onSave={onSaveProvider}
        onNew={onNewProvider}
        onDelete={onDeleteProvider}
        isDraftNew={isDraftNew}
      />

      {/* Cloud Storage Settings Dialog (S3 / WebDAV) */}
      <StorageDialog
        key={isStorageDialogOpen ? 'storage-open' : 'storage-closed'}
        open={isStorageDialogOpen}
        onOpenChange={onStorageDialogChange}
        config={storageConfig}
        onSave={onSaveStorageConfig}
      />

      {/* Fullscreen Image Preview Dialog */}
      <ImagePreviewDialog
        item={previewItem}
        onClose={onClosePreview}
        onNavigate={onNavigatePreview}
        currentIndex={previewIndex}
        totalCount={totalCount}
        onReuse={onReuseImage}
        onUploadToCloud={onUploadToCloud}
        isCloudConfigured={storageConfig.type !== 'local'}
      />

      {/* Reused Confirmation Alert Dialog */}
      <ConfirmDialog dialog={confirmDialog} onClose={onCloseConfirmDialog} />
    </>
  )
}
