import { Link, useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export function Header() {
  const location = useLocation()
  const isImagePage = location.pathname === '/image'

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="brand-gradient size-7 rounded-lg shadow-sm" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-foreground">WebTools</span>
              <span className="font-mono text-[10px] uppercase text-muted-foreground">AI Toolbox</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors sm:px-3 sm:py-1.5 ${
                location.pathname === '/'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              首页
            </Link>
            <Link
              to="/image"
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors sm:gap-1.5 sm:px-3 sm:py-1.5 ${
                isImagePage
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <Sparkles className="size-3 text-blue-500 sm:size-3.5" />
              <span className="sm:inline">图片</span>
              <span className="hidden sm:inline">工作台</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
