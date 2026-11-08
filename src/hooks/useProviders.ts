import { useState, useCallback, useMemo } from 'react'
import type { ProviderConfig } from '@/types/image'
import {
  createId,
  normalizeProvider,
  loadStoredProviders,
  saveStoredProviders,
} from '@/lib/image-db'
import { toast } from 'sonner'

export function useProviders() {
  const [providersData] = useState(() => loadStoredProviders())
  const [providers, setProviders] = useState<ProviderConfig[]>(providersData.providers)
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providersData.selectedId)

  // Active saved provider used for generation
  const selectedProvider = useMemo(() => {
    return providers.find((p) => p.id === selectedProviderId) || providers[0]
  }, [providers, selectedProviderId])

  // Draft form state used exclusively inside ProviderDialog
  const [providerDraft, setProviderDraft] = useState<ProviderConfig>(selectedProvider)
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState<boolean>(false)

  // Check if the current draft is an unsaved new provider
  const isDraftNew = useMemo(() => {
    return !providers.some((p) => p.id === providerDraft.id)
  }, [providers, providerDraft.id])

  // Open dialog and reset draft from currently selected provider
  const openProviderDialog = useCallback(() => {
    setProviderDraft({ ...selectedProvider })
    setIsProviderDialogOpen(true)
  }, [selectedProvider])

  const closeProviderDialog = useCallback(() => {
    setIsProviderDialogOpen(false)
  }, [])

  // Switch active provider in workspace (not in dialog)
  const selectActiveProvider = useCallback((id: string) => {
    setSelectedProviderId(id)
    saveStoredProviders(providers, id)
  }, [providers])

  // Switch editing provider inside dialog: immediately load matching provider into draft
  const selectDraftProvider = useCallback(
    (id: string) => {
      const target = providers.find((p) => p.id === id)
      if (target) {
        setProviderDraft({ ...target })
      }
    },
    [providers]
  )

  // Save draft to providers list
  const saveProviderDraft = useCallback(
    (draft: ProviderConfig) => {
      const updated = normalizeProvider(draft)
      const idx = providers.findIndex((p) => p.id === updated.id)
      const nextList = idx >= 0
        ? providers.map((p) => (p.id === updated.id ? updated : p))
        : [...providers, updated]

      // Side effects executed cleanly outside state updaters
      saveStoredProviders(nextList, updated.id)
      setProviders(nextList)
      setSelectedProviderId(updated.id)
      setIsProviderDialogOpen(false)
      toast.success(`已保存 Provider：${updated.name}`)
    },
    [providers]
  )

  // Create a brand new draft provider inside dialog
  const createNewProviderDraft = useCallback(() => {
    const newProv = normalizeProvider({
      id: createId('provider'),
      name: `Provider ${providers.length + 1}`,
      apiBaseUrl: '',
      apiKey: '',
      model: 'gpt-image-1',
      outputFormat: 'png',
    })
    setProviderDraft(newProv)
    toast.info('已创建新 Provider 草稿，请填写后保存。')
  }, [providers.length])

  // Delete current editing provider or discard new draft
  const deleteOrDiscardDraft = useCallback(
    (requestConfirm: (title: string, description: string, onConfirm: () => void) => void) => {
      if (isDraftNew) {
        setProviderDraft({ ...selectedProvider })
        toast.info('已放弃新建草稿')
        return
      }

      if (providers.length <= 1) return

      requestConfirm(
        `确认删除 Provider「${providerDraft.name}」？`,
        '删除后此 API 提供商的配置将被移除。',
        () => {
          const nextList = providers.filter((p) => p.id !== providerDraft.id)
          const nextSelected = nextList[0].id

          saveStoredProviders(nextList, nextSelected)
          setProviders(nextList)
          setSelectedProviderId(nextSelected)
          setProviderDraft({ ...nextList[0] })
          toast.success('Provider 已删除')
        }
      )
    },
    [isDraftNew, providers, providerDraft, selectedProvider]
  )

  return {
    providers,
    selectedProviderId,
    selectedProvider,
    providerDraft,
    setProviderDraft,
    isDraftNew,
    isProviderDialogOpen,
    openProviderDialog,
    closeProviderDialog,
    selectActiveProvider,
    selectDraftProvider,
    saveProviderDraft,
    createNewProviderDraft,
    deleteOrDiscardDraft,
  }
}
