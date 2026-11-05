import { useState, useCallback } from 'react'
import type { ProviderConfig, OutputFormat } from '@/types/image'
import {
  createId,
  normalizeProvider,
  loadStoredProviders,
  saveStoredProviders,
} from '@/lib/image-db'
import { toast } from 'sonner'

export function useProviders(initialOutputFormat?: OutputFormat) {
  const [providersData] = useState(() => loadStoredProviders())
  const [providers, setProviders] = useState<ProviderConfig[]>(providersData.providers)
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providersData.selectedId)
  const [providerForm, setProviderForm] = useState<ProviderConfig>(() => {
    return (
      providersData.providers.find((p) => p.id === providersData.selectedId) ||
      providersData.providers[0]
    )
  })
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState<boolean>(false)

  const handleSelectProvider = useCallback(
    (id: string, onOutputFormatSync?: (fmt: OutputFormat) => void) => {
      setSelectedProviderId(id)
      const provider = providers.find((p) => p.id === id)
      if (provider) {
        setProviderForm(provider)
        if (onOutputFormatSync) {
          onOutputFormatSync(provider.outputFormat || 'png')
        }
        saveStoredProviders(providers, id)
      }
    },
    [providers]
  )

  const handleSaveProvider = useCallback(
    (currentOutputFormat?: OutputFormat) => {
      const updated = normalizeProvider({
        ...providerForm,
        outputFormat: currentOutputFormat || providerForm.outputFormat || 'png',
      })
      const index = providers.findIndex((p) => p.id === updated.id)
      let nextList: ProviderConfig[] = []
      if (index >= 0) {
        nextList = [...providers]
        nextList[index] = updated
      } else {
        nextList = [...providers, updated]
      }
      setProviders(nextList)
      setProviderForm(updated)
      saveStoredProviders(nextList, updated.id)
      setIsProviderDialogOpen(false)
      toast.success(`已保存 Provider：${updated.name}`)
    },
    [providerForm, providers]
  )

  const handleNewProvider = useCallback(() => {
    const newProv = normalizeProvider({
      id: createId('provider'),
      name: `Provider ${providers.length + 1}`,
      apiBaseUrl: '',
      apiKey: '',
      model: 'gpt-image-2.5-sunburst',
      outputFormat: initialOutputFormat || 'png',
    })
    const nextList = [...providers, newProv]
    setProviders(nextList)
    setSelectedProviderId(newProv.id)
    setProviderForm(newProv)
    saveStoredProviders(nextList, newProv.id)
    toast.info('已新建 Provider，请填写配置后保存。')
  }, [initialOutputFormat, providers])

  const handleDeleteProvider = useCallback(
    (requestConfirm: (title: string, description: string, onConfirm: () => void) => void) => {
      if (providers.length <= 1) return
      const prov = providers.find((p) => p.id === selectedProviderId) || providers[0]
      requestConfirm(
        `确认删除 Provider「${prov.name}」？`,
        '删除后此 API 提供商的配置将被移除。',
        () => {
          const nextList = providers.filter((p) => p.id !== prov.id)
          setProviders(nextList)
          const nextSelected = nextList[0].id
          setSelectedProviderId(nextSelected)
          setProviderForm(nextList[0])
          saveStoredProviders(nextList, nextSelected)
          toast.success('Provider 已删除')
        }
      )
    },
    [providers, selectedProviderId]
  )

  return {
    providers,
    selectedProviderId,
    providerForm,
    setProviderForm,
    isProviderDialogOpen,
    setIsProviderDialogOpen,
    handleSelectProvider,
    handleSaveProvider,
    handleNewProvider,
    handleDeleteProvider,
  }
}
