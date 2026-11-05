import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, StopCircle, Loader2, ImageIcon } from 'lucide-react'

interface PromptComposerProps {
  prompt: string
  onPromptChange: (val: string) => void
  onGenerate: () => void
  onStop: () => void
  isGenerating: boolean
  referencesCount: number
  batchCount: number
}

export function PromptComposer({
  prompt,
  onPromptChange,
  onGenerate,
  onStop,
  isGenerating,
  referencesCount,
  batchCount,
}: PromptComposerProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      onGenerate()
    }
  }

  return (
    <Card className="border-border/80 bg-card shadow-xs">
      <CardContent className="p-3 sm:p-3.5 space-y-2.5">
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入图片描述。例如：赛博朋克雨夜街道，霓虹倒影，电影质感光影，超清细节，虚幻引擎渲染风格..."
          className="min-h-20 sm:min-h-24 max-h-60 resize-y text-sm border-input/60 focus-visible:ring-1 break-words"
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {referencesCount > 0 ? (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                <ImageIcon className="size-3.5" />
                参考图模式 ({referencesCount} 张)
              </span>
            ) : (
              <span className="text-muted-foreground/80">文本生成</span>
            )}
            <span className="text-muted-foreground/40">·</span>
            <span className="hidden sm:inline-block">
              按 <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">Ctrl + Enter</kbd> 快捷生成
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isGenerating && (
              <Button
                variant="outline"
                size="sm"
                onClick={onStop}
                className="flex-1 sm:flex-initial gap-1.5 text-xs text-destructive hover:bg-destructive/10 h-8"
              >
                <StopCircle className="size-3.5" />
                停止
              </Button>
            )}

            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              size="sm"
              className="flex-1 sm:flex-initial gap-1.5 text-xs sm:min-w-28 h-8 font-medium"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  批次生成中
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  生成 ({batchCount}张)
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
