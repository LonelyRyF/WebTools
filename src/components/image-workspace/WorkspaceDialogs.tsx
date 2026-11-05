import type { ProviderConfig, LibraryItem } from '@/types/image'
import type { StorageConfig } from '@/types/storage'
import { downloadImage } from '@/lib/format'
import { ProviderDialog } from '@/components/image-workspace/ProviderDialog'
import { StorageDialog } from '@/components/image-workspace/StorageDialog'
import { ImagePreviewDialog } from '@/components/image-workspace/ImagePreviewDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface ConfirmDialogState {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  variant?: 'default' | 'destructive'
  action: () => void
}

interface WorkspaceDialogsProps {
  // Provider Dialog
  isProviderDialogOpen: boolean
  onProviderDialogChange: (open: boolean) => void
  providers: ProviderConfig[]
  selectedProviderId: string
  onSelectProvider: (id: string) => void
  providerForm: ProviderConfig
  onUpdateProviderForm: (form: ProviderConfig) => void
  onSaveProvider: () => void
  onNewProvider: () => void
  onDeleteProvider: () => void

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
  selectedProviderId,
  onSelectProvider,
  providerForm,
  onUpdateProviderForm,
  onSaveProvider,
  onNewProvider,
  onDeleteProvider,
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
        selectedProviderId={selectedProviderId}
        onSelectProvider={onSelectProvider}
        providerForm={providerForm}
        onUpdateProviderForm={onUpdateProviderForm}
        onSave={onSaveProvider}
        onNew={onNewProvider}
        onDelete={onDeleteProvider}
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
        onDownload={downloadImage}
        onUploadToCloud={onUploadToCloud}
        isCloudConfigured={storageConfig.type !== 'local'}
      />

      {/* Confirmation Alert Dialog */}
      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => !open && onCloseConfirmDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmDialog.variant}
              onClick={() => {
                confirmDialog.action()
                onCloseConfirmDialog()
              }}
            >
              {confirmDialog.confirmText || '确认'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
