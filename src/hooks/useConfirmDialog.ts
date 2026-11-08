import { useState, useCallback } from 'react'

export interface ConfirmDialogState {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  variant?: 'default' | 'destructive'
  action: () => void
}

export function useConfirmDialog() {
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

  const closeConfirm = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
  }, [])

  return {
    confirmDialog,
    requestConfirm,
    closeConfirm,
  }
}
