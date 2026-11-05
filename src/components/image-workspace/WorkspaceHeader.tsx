import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sparkles,
  SlidersHorizontal,
  Settings,
  Trash2,
  Cloud,
} from 'lucide-react'
import { toast } from 'sonner'
import type { StorageType } from '@/types/storage'
import { PROMPT_PRESETS } from '@/lib/presets'

interface WorkspaceHeaderProps {
  onOpenMobileSidebar: () => void
  referencesCount: number
  onApplyPromptPreset: (prompt: string) => void
  onOpenProviderDialog: () => void
  onOpenStorageDialog: () => void
  storageType: StorageType
  onClearLibrary: () => void
  libraryCount: number
}

export function WorkspaceHeader({
  onOpenMobileSidebar,
  referencesCount,
  onApplyPromptPreset,
  onOpenProviderDialog,
  onOpenStorageDialog,
  storageType,
  onClearLibrary,
  libraryCount,
}: WorkspaceHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Brand & Clean Title */}
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-4.5" />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            AI 图片工作台
          </h1>
          <p className="text-xs text-muted-foreground">
            多模型并发生成、参考图编辑与云端存储同步
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Mobile Sheet Trigger */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs lg:hidden h-8"
          onClick={onOpenMobileSidebar}
        >
          <SlidersHorizontal className="size-3.5" />
          <span>控制面板</span>
          {referencesCount > 0 && (
            <Badge variant="secondary" className="size-4 p-0 text-[10px] justify-center">
              {referencesCount}
            </Badge>
          )}
        </Button>

        {/* Prompt Inspiration Presets Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                  <Sparkles className="size-3.5 text-amber-500" />
                  <span className="hidden sm:inline">灵感预设</span>
                  <span className="sm:hidden">预设</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>选择风格预设快速填充提示词</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-xs">提示词风格灵感</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PROMPT_PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset.label}
                onClick={() => {
                  onApplyPromptPreset(preset.prompt)
                  toast.success(`已载入「${preset.label}」提示词`)
                }}
                className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
              >
                <span className="text-xs font-medium text-foreground">{preset.label}</span>
                <span className="text-[11px] text-muted-foreground">{preset.description}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Cloud Storage Settings Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenStorageDialog}
              className="gap-1.5 text-xs h-8"
            >
              <Cloud
                className={`size-3.5 ${
                  storageType !== 'local' ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'
                }`}
              />
              <span className="hidden sm:inline">云存储</span>
              <span className="sm:hidden">云端</span>
              {storageType !== 'local' && (
                <span className="size-1.5 rounded-full bg-emerald-500" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>配置 S3 对象存储或 WebDAV 远程备份</TooltipContent>
        </Tooltip>

        {/* Provider Settings Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenProviderDialog}
              className="gap-1.5 text-xs h-8"
            >
              <Settings className="size-3.5" />
              <span className="hidden sm:inline">Provider 配置</span>
              <span className="sm:hidden">配置</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>管理 API 端点、Base URL 与 API Key</TooltipContent>
        </Tooltip>

        {/* Clear Library Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearLibrary}
              disabled={libraryCount === 0}
              className="gap-1.5 text-xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">清空图库</span>
              <span className="sm:hidden">清空</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>清空本地数据库中的所有图片记录</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
