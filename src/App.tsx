import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Home } from '@/pages/Home'
import { ImageWorkspace } from '@/pages/ImageWorkspace'
import { Toaster } from '@/components/ui/sonner'

const CURRENT_YEAR = new Date().getFullYear()

export function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <Toaster />
        <div className="ambient-bg" aria-hidden="true" />
        <Header />
        <main className="flex-1 relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/image" element={<ImageWorkspace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="relative z-10 border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
          <p>© {CURRENT_YEAR} WebTools · AI 图片工作台 · Local-First Architecture</p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
