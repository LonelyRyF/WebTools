import type { ReactNode } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sliders, ImageIcon, ListOrdered, Loader2 } from 'lucide-react'

interface StudioControlPanelProps {
  activeTab: 'params' | 'reference' | 'queue'
  onTabChange: (tab: 'params' | 'reference' | 'queue') => void
  referenceCount: number
  isGenerating: boolean
  params: ReactNode
  reference: ReactNode
  queue: ReactNode
}

export function StudioControlPanel({
  activeTab,
  onTabChange,
  referenceCount,
  isGenerating,
  params,
  reference,
  queue,
}: StudioControlPanelProps) {
  return (
    <Card className="border-border/80 bg-card shadow-xs lg:sticky lg:top-16">
      <Tabs
        value={activeTab}
        onValueChange={(val) => onTabChange(val as 'params' | 'reference' | 'queue')}
        className="w-full"
      >
        <CardHeader className="p-3 pb-2 border-b">
          <TabsList className="w-full grid grid-cols-3 h-8">
            <TabsTrigger value="params" className="gap-1.5 text-xs h-6.5">
              <Sliders className="size-3.5" />
              参数
            </TabsTrigger>
            <TabsTrigger value="reference" className="gap-1.5 text-xs h-6.5">
              <ImageIcon className="size-3.5" />
              参考 ({referenceCount})
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-1.5 text-xs h-6.5">
              <ListOrdered className="size-3.5" />
              队列 {isGenerating && <Loader2 className="size-3 animate-spin text-blue-500" />}
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent className="p-3.5 pt-3">
          <TabsContent value="params" className="mt-0 outline-none">
            {params}
          </TabsContent>

          <TabsContent value="reference" className="mt-0 outline-none">
            {reference}
          </TabsContent>

          <TabsContent value="queue" className="mt-0 outline-none">
            {queue}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
