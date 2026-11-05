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

interface ConfirmDialogProps {
  dialog: ConfirmDialogState
  onClose: () => void
}

export function ConfirmDialog({ dialog, onClose }: ConfirmDialogProps) {
  return (
    <AlertDialog open={dialog.isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
          <AlertDialogDescription>{dialog.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>取消</AlertDialogCancel>
          <AlertDialogAction
            variant={dialog.variant}
            onClick={() => {
              dialog.action()
              onClose()
            }}
          >
            {dialog.confirmText || '确认'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
