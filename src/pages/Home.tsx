import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ArrowRight, Image as ImageIcon, Zap, ShieldCheck } from 'lucide-react'

export function Home() {
  return (
    <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <Badge variant="outline" className="mb-4 gap-1.5 border-blue-500/30 bg-blue-50/50 py-1 text-xs text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
          <Sparkles className="size-3" />
          Web Developer & AI Tools
        </Badge>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          现代 Web 工具集合平台
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          基于 React & shadcn/ui 构建的高性能本地优先工具箱。已集成 AI 图片生成与管理工作台。
        </p>

        <div className="mt-8 flex gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link to="/image">
              进入 AI 图片工作台
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="group relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <ImageIcon className="size-5" />
            </div>
            <div className="flex items-center justify-between">
              <CardTitle>AI 图片工作台</CardTitle>
              <Badge variant="secondary" className="text-[10px]">已就绪</Badge>
            </div>
            <CardDescription>
              支持多 Provider、标准文本生成与参考图编辑及并发批处理。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                IndexedDB 本地存储 · 支持 S3 & WebDAV 云端同步
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                并发任务队列与耗时追踪
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                图库检索、多选复用与批量导出
              </div>
            </div>
            <div className="mt-5">
              <Button asChild variant="outline" className="w-full justify-between">
                <Link to="/image">
                  打开工具
                  <ArrowRight className="size-3.5 opacity-60 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:border-border/80">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400">
              <Zap className="size-5" />
            </div>
            <CardTitle>高性能并发调度</CardTitle>
            <CardDescription>
              轻量并发控制，支持任务实时暂停、流式结果捕获与错误熔断。
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            采用标准 Web Streams 与 AbortController，支持 1~6 线程并发安全生成。
          </CardContent>
        </Card>

        <Card className="transition-all hover:border-border/80">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
              <ShieldCheck className="size-5" />
            </div>
            <CardTitle>Local-First 本地优先</CardTitle>
            <CardDescription>
              所有 API 密钥、配置及生成图片均保存在浏览器本地，安全隐私。
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            自动优先使用 IndexedDB 大容量持久化，同时支持无缝扩展至 S3 与 WebDAV 云端备份。
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
