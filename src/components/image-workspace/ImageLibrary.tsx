import type { LibraryItem } from '@/types/image'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { ImageCard } from './ImageCard'
import {
  Search,
  Share2,
  Download,
  Trash2,
  Image as ImageIcon,
  CloudUpload,
} from 'lucide-react'

interface ImageLibraryProps {
  library: LibraryItem[]
  filteredItems: LibraryItem[]
  selectedImageIds: Set<string>
  filter: 'all' | 'favorite' | 'edited'
  onFilterChange: (filter: 'all' | 'favorite' | 'edited') => void
  search: string
  onSearchChange: (search: string) => void
  sort: 'newest' | 'oldest'
  onSortChange: (sort: 'newest' | 'oldest') => void
  onToggleSelectAll: () => void
  isAllSelected: boolean
  onToggleSelect: (id: string) => void
  onToggleFavorite: (id: string) => void
  onOpenPreview: (item: LibraryItem) => void
  onReuse: (ids: string[]) => void
  onDownloadSelected: () => void
  onDeleteSelected: (ids: string[]) => void
  onDownloadSingle: (dataUrl: string, filename: string) => void
  onDeleteSingle: (id: string) => void
  isCloudConfigured?: boolean
  onUploadSelectedToCloud?: () => void
  onUploadSingleToCloud?: (item: LibraryItem) => void
}

export function ImageLibrary({
  library,
  filteredItems,
  selectedImageIds,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  sort,
  onSortChange,
  onToggleSelectAll,
  isAllSelected,
  onToggleSelect,
  onToggleFavorite,
  onOpenPreview,
  onReuse,
  onDownloadSelected,
  onDeleteSelected,
  onDownloadSingle,
  onDeleteSingle,
  isCloudConfigured,
  onUploadSelectedToCloud,
  onUploadSingleToCloud,
}: ImageLibraryProps) {
  return (
    <Card className="border-border/80 bg-card shadow-xs">
      <CardHeader className="p-3 pb-3 border-b space-y-3 sm:p-4">
        {/* Header line: Title + Tabs on left, Search + Sort + Select All on right */}
        <div className="flex flex-col gap-2.5 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-start sm:gap-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold sm:text-base">生成图库</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {library.length}
              </Badge>
            </div>

            <Tabs
              value={filter}
              onValueChange={(val) => onFilterChange(val as 'all' | 'favorite' | 'edited')}
            >
              <TabsList className="h-7.5">
                <TabsTrigger value="all" className="text-xs px-2 sm:px-2.5 h-6">全部</TabsTrigger>
                <TabsTrigger value="favorite" className="text-xs px-2 sm:px-2.5 h-6">收藏</TabsTrigger>
                <TabsTrigger value="edited" className="text-xs px-2 sm:px-2.5 h-6">编辑结果</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="relative min-w-[120px] flex-1 sm:w-56 sm:flex-initial">
              <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="筛选关键词..."
                className="h-8 pl-8 text-xs"
              />
            </div>

            <Select value={sort} onValueChange={(val) => onSortChange(val as 'newest' | 'oldest')}>
              <SelectTrigger className="h-8 w-24 sm:w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-xs">最新优先</SelectItem>
                <SelectItem value="oldest" className="text-xs">最早优先</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={onToggleSelectAll}
              disabled={filteredItems.length === 0}
              className="h-8 px-2 sm:px-3 text-xs"
            >
              {isAllSelected ? '取消全选' : '全选'}
            </Button>
          </div>
        </div>

        {/* Selection Action Bar (appears when items are selected) */}
        {selectedImageIds.size > 0 && (
          <div className="flex flex-col gap-2 rounded-lg bg-muted/60 p-2 sm:flex-row sm:items-center sm:justify-between text-xs animate-in fade-in duration-150">
            <span className="font-medium text-foreground">
              已选 {selectedImageIds.size} 张图片
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="outline"
                size="xs"
                onClick={() => onReuse(Array.from(selectedImageIds))}
                className="gap-1 text-xs"
              >
                <Share2 className="size-3" />
                设为参考图
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={onDownloadSelected}
                className="gap-1 text-xs"
              >
                <Download className="size-3" />
                下载所选
              </Button>
              {isCloudConfigured && onUploadSelectedToCloud && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={onUploadSelectedToCloud}
                  className="gap-1 text-xs text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                >
                  <CloudUpload className="size-3" />
                  上传至云端
                </Button>
              )}
              <Button
                variant="destructive"
                size="xs"
                onClick={() => onDeleteSelected(Array.from(selectedImageIds))}
                className="gap-1 text-xs"
              >
                <Trash2 className="size-3" />
                删除所选
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-2.5 sm:p-4">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
            <ImageIcon className="size-9 text-muted-foreground/50" />
            <p className="mt-2.5 text-sm font-semibold text-foreground">暂无符合条件的图片</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {library.length === 0 ? '完成生成任务后，图片将实时保存在此。' : '请尝试调整筛选或搜索关键词。'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredItems.map((item) => (
              <ImageCard
                key={item.id}
                item={item}
                isSelected={selectedImageIds.has(item.id)}
                onToggleSelect={onToggleSelect}
                onToggleFavorite={onToggleFavorite}
                onOpenPreview={onOpenPreview}
                onReuse={(id) => onReuse([id])}
                onDownload={onDownloadSingle}
                onDelete={(id) => onDeleteSingle(id)}
                onUploadToCloud={onUploadSingleToCloud}
                isCloudConfigured={isCloudConfigured}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
