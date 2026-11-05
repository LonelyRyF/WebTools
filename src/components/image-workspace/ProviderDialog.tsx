import type { ProviderConfig } from '@/types/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

interface ProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  providers: ProviderConfig[]
  selectedProviderId: string
  onSelectProvider: (id: string) => void
  providerForm: ProviderConfig
  onUpdateProviderForm: (form: ProviderConfig) => void
  onSave: () => void
  onNew: () => void
  onDelete: () => void
}

export function ProviderDialog({
  open,
  onOpenChange,
  providers,
  selectedProviderId,
  onSelectProvider,
  providerForm,
  onUpdateProviderForm,
  onSave,
  onNew,
  onDelete,
}: ProviderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API 提供商配置</DialogTitle>
          <DialogDescription>
            配置 Base URL 与 API Key，系统将自动调用 /v1/images 标准生成与编辑端点。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">当前配置</label>
            <Select value={selectedProviderId} onValueChange={onSelectProvider}>
              <SelectTrigger className="w-full text-xs">
                <SelectValue />
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

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Provider 名称</label>
            <Input
              value={providerForm.name}
              onChange={(e) => onUpdateProviderForm({ ...providerForm, name: e.target.value })}
              placeholder="例如 OpenAI / New API"
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">API Base URL</label>
            <Input
              value={providerForm.apiBaseUrl}
              onChange={(e) => onUpdateProviderForm({ ...providerForm, apiBaseUrl: e.target.value })}
              placeholder="https://api.openai.com"
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">API Key</label>
            <Input
              type="password"
              value={providerForm.apiKey}
              onChange={(e) => onUpdateProviderForm({ ...providerForm, apiKey: e.target.value })}
              placeholder="sk-..."
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">模型名称 (Model)</label>
            <Input
              value={providerForm.model}
              onChange={(e) => onUpdateProviderForm({ ...providerForm, model: e.target.value })}
              placeholder="gpt-image-2.5-sunburst"
              className="text-xs"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between pt-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onNew}>
              新建
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={providers.length <= 1}
            >
              删除
            </Button>
          </div>
          <Button size="sm" onClick={onSave}>
            保存配置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
