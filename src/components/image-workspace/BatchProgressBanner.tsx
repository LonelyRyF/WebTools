import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
} from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Loader2, StopCircle } from 'lucide-react'
import { formatDuration } from '@/lib/format'

interface BatchProgressBannerProps {
  focusedBatchId: string | null
  batchCount: number
  parallelCount: number
  batchStats: {
    total: number
    running: number
    success: number
    error: number
    finished: number
  }
  elapsedMs: number
  onStop: () => void
}

export function BatchProgressBanner({
  focusedBatchId,
  batchCount,
  parallelCount,
  batchStats,
  elapsedMs,
  onStop,
}: BatchProgressBannerProps) {
  const percent = batchStats.total
    ? Math.round((batchStats.finished / batchStats.total) * 100)
    : 0

  return (
    <Alert className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 text-foreground shadow-xs animate-in fade-in duration-200">
      <Loader2 className="size-4 animate-spin text-blue-500" />
      <div className="flex-1 min-w-0 pr-2">
        <AlertTitle className="text-xs font-semibold flex items-center gap-2">
          <span>批次生成任务执行中 (#{focusedBatchId ? focusedBatchId.slice(-6) : ''})</span>
          <Badge
            variant="outline"
            className="text-[10px] h-4.5 px-1.5 border-blue-500/30 text-blue-600 dark:text-blue-400 font-normal"
          >
            并发: {Math.min(batchCount, parallelCount)} 线程
          </Badge>
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>已完成：{batchStats.finished} / {batchStats.total} 项</span>
          <span>运行中：{batchStats.running} 项</span>
          {batchStats.error > 0 && (
            <span className="text-destructive">失败：{batchStats.error} 项</span>
          )}
          <span>已耗时：{formatDuration(elapsedMs)}</span>
        </AlertDescription>
        <div className="mt-2 flex items-center gap-2">
          <Progress value={percent} className="h-1.5 flex-1" />
          <span className="font-mono text-[10px] text-muted-foreground shrink-0">
            {percent}%
          </span>
        </div>
      </div>
      <AlertAction className="top-2.5 right-2.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="xs"
              onClick={onStop}
              className="gap-1 h-6.5 text-[11px]"
            >
              <StopCircle className="size-3" />
              停止批次
            </Button>
          </TooltipTrigger>
          <TooltipContent>终止正在排队及请求中的批次任务</TooltipContent>
        </Tooltip>
      </AlertAction>
    </Alert>
  )
}
