import { useState } from 'react'
import type { StorageConfig, StorageType, S3Config, WebDavConfig } from '@/types/storage'
import { testStorageConnection } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  HardDrive,
  Cloud,
  FolderSync,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

interface StorageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: StorageConfig
  onSave: (newConfig: StorageConfig) => void
}

export function StorageDialog({
  open,
  onOpenChange,
  config,
  onSave,
}: StorageDialogProps) {
  const [form, setForm] = useState<StorageConfig>(config)
  const [activeTab, setActiveTab] = useState<StorageType>(config.type || 'local')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleTest = async () => {
    if (activeTab === 'local') {
      toast.info('本地 IndexedDB 存储已默认可用')
      return
    }

    setTesting(true)
    setTestResult(null)
    try {
      const res = await testStorageConnection(form, activeTab)
      setTestResult(res)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error('连接测试失败，请检查配置')
      }
    } catch (e: unknown) {
      const msg = (e as Error)?.message || '连接异常'
      setTestResult({ success: false, message: msg })
      toast.error(msg)
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    const updated: StorageConfig = {
      ...form,
      type: activeTab,
    }
    onSave(updated)
    onOpenChange(false)
    toast.success(
      `已保存存储配置：${activeTab === 's3' ? 'S3 兼容存储' : activeTab === 'webdav' ? 'WebDAV' : '仅本地存储'}`
    )
  }

  const updateS3 = (fields: Partial<S3Config>) => {
    setForm((prev) => ({
      ...prev,
      s3: { ...prev.s3, ...fields },
    }))
    setTestResult(null)
  }

  const updateWebDav = (fields: Partial<WebDavConfig>) => {
    setForm((prev) => ({
      ...prev,
      webdav: { ...prev.webdav, ...fields },
    }))
    setTestResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Cloud className="size-4" />
            </div>
            <DialogTitle className="text-base sm:text-lg">云端存储设置 (S3 / WebDAV)</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            支持将生成的图片及其元数据自动或手动备份至 S3 对象存储或 WebDAV 服务。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Storage Type Selector Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as StorageType)
              setTestResult(null)
            }}
          >
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="local" className="gap-1.5 text-xs">
                <HardDrive className="size-3.5" />
                本地存储
              </TabsTrigger>
              <TabsTrigger value="s3" className="gap-1.5 text-xs">
                <Cloud className="size-3.5" />
                S3 兼容存储
              </TabsTrigger>
              <TabsTrigger value="webdav" className="gap-1.5 text-xs">
                <FolderSync className="size-3.5" />
                WebDAV
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: LOCAL STORAGE */}
            <TabsContent value="local" className="space-y-3 pt-3 outline-none">
              <div className="rounded-xl border bg-muted/30 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-foreground font-medium text-xs sm:text-sm">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  <span>本地优先模式 (IndexedDB)</span>
                  <Badge variant="outline" className="text-[10px] h-4.5 border-emerald-500/30 text-emerald-600">
                    默认激活
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  图片直接保存在当前浏览器的 IndexedDB 数据库中，拥有极高的读写速度和隐私安全性，无需任何外部网络服务即可正常使用。
                </p>
                <div className="text-[11px] text-muted-foreground/80 pt-1">
                  💡 如果需要跨设备多端同步或长久备份，请切换至上方「S3 兼容存储」或「WebDAV」选项。
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: S3 COMPATIBLE STORAGE */}
            <TabsContent value="s3" className="space-y-3.5 pt-3 outline-none">
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 text-xs text-indigo-900 dark:text-indigo-300">
                <div className="flex items-center gap-1.5 font-medium">
                  <Zap className="size-3.5 text-indigo-500" />
                  <span>支持 AWS S3、Cloudflare R2、MinIO、阿里云 OSS、腾讯云 COS 等</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  注意：在浏览器中直接上传需确保存储桶配置了 <strong>CORS（跨域规则）</strong>，允许当前域名的 PUT、GET 与 HEAD 操作。
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>S3 Endpoint (服务端点)*</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      例：https://&lt;id&gt;.r2.cloudflarestorage.com
                    </span>
                  </label>
                  <Input
                    value={form.s3.endpoint}
                    onChange={(e) => updateS3({ endpoint: e.target.value })}
                    placeholder="https://s3.us-east-1.amazonaws.com"
                    className="text-xs font-mono h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">存储桶名称 (Bucket)*</label>
                  <Input
                    value={form.s3.bucket}
                    onChange={(e) => updateS3({ bucket: e.target.value })}
                    placeholder="my-ai-images"
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">地域 (Region)</label>
                  <Input
                    value={form.s3.region}
                    onChange={(e) => updateS3({ region: e.target.value })}
                    placeholder="auto 或 us-east-1"
                    className="text-xs font-mono h-8"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground">Access Key ID*</label>
                  <Input
                    value={form.s3.accessKeyId}
                    onChange={(e) => updateS3({ accessKeyId: e.target.value })}
                    placeholder="AKIA..."
                    className="text-xs font-mono h-8"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground">Secret Access Key*</label>
                  <Input
                    type="password"
                    value={form.s3.secretAccessKey}
                    onChange={(e) => updateS3({ secretAccessKey: e.target.value })}
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    className="text-xs font-mono h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">保存目录路径前缀</label>
                  <Input
                    value={form.s3.pathPrefix}
                    onChange={(e) => updateS3({ pathPrefix: e.target.value })}
                    placeholder="ai-images/"
                    className="text-xs font-mono h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>公开访问前缀 (可选)</span>
                  </label>
                  <Input
                    value={form.s3.publicUrlPrefix || ''}
                    onChange={(e) => updateS3({ publicUrlPrefix: e.target.value })}
                    placeholder="https://cdn.example.com"
                    className="text-xs font-mono h-8"
                  />
                </div>

                <div className="sm:col-span-2 pt-1 flex items-center gap-2">
                  <Checkbox
                    id="s3-path-style"
                    checked={form.s3.forcePathStyle !== false}
                    onCheckedChange={(checked) => updateS3({ forcePathStyle: Boolean(checked) })}
                  />
                  <label
                    htmlFor="s3-path-style"
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                  >
                    强制路径风格 (Path Style URL) · 推荐 MinIO、Cloudflare R2 与自建 S3 开启
                  </label>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: WEBDAV STORAGE */}
            <TabsContent value="webdav" className="space-y-3.5 pt-3 outline-none">
              <div className="rounded-lg border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 text-xs text-blue-900 dark:text-blue-300">
                <div className="flex items-center gap-1.5 font-medium">
                  <FolderSync className="size-3.5 text-blue-500" />
                  <span>支持坚果云、Nextcloud、Alist、ownCloud 等 WebDAV 服务</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  提示：如使用坚果云等，请前往账号安全设置中生成并使用「应用授权密码 (App Password)」。
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>WebDAV 服务器地址 (URL)*</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      例：https://dav.jianguoyun.com/dav/
                    </span>
                  </label>
                  <Input
                    value={form.webdav.url}
                    onChange={(e) => updateWebDav({ url: e.target.value })}
                    placeholder="https://dav.jianguoyun.com/dav/"
                    className="text-xs font-mono h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">用户名 (Username)*</label>
                  <Input
                    value={form.webdav.username}
                    onChange={(e) => updateWebDav({ username: e.target.value })}
                    placeholder="user@example.com"
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">密码 / 应用令牌 (Password)*</label>
                  <Input
                    type="password"
                    value={form.webdav.password}
                    onChange={(e) => updateWebDav({ password: e.target.value })}
                    placeholder="应用专用密码"
                    className="text-xs font-mono h-8"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground">保存目录路径</label>
                  <Input
                    value={form.webdav.pathPrefix}
                    onChange={(e) => updateWebDav({ pathPrefix: e.target.value })}
                    placeholder="ai-images/"
                    className="text-xs font-mono h-8"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Sync Behavior Options (Visible when S3 or WebDAV selected) */}
          {activeTab !== 'local' && (
            <div className="rounded-lg border bg-card/60 p-3 space-y-2.5">
              <span className="text-xs font-semibold text-foreground">同步偏好</span>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="auto-upload"
                    checked={form.autoUpload}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, autoUpload: Boolean(checked) }))
                    }
                  />
                  <label
                    htmlFor="auto-upload"
                    className="text-xs text-foreground cursor-pointer select-none"
                  >
                    生成完成后自动上传至云存储 (推荐)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="save-metadata"
                    checked={form.saveMetadataJson}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, saveMetadataJson: Boolean(checked) }))
                    }
                  />
                  <label
                    htmlFor="save-metadata"
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                  >
                    同步保存元数据 JSON (包含完整提示词、模型、尺寸与生成时间)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Test Connection Result Alert */}
          {testResult && (
            <div
              className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
                testResult.success
                  ? 'border-emerald-500/30 bg-emerald-50/50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300'
                  : 'border-destructive/30 bg-destructive/10 text-destructive'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
              )}
              <div className="flex-1 break-words leading-relaxed">{testResult.message}</div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between pt-2 border-t">
          <div>
            {activeTab !== 'local' ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={testing}
                onClick={handleTest}
                className="gap-1.5 text-xs h-8"
              >
                {testing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    测试中...
                  </>
                ) : (
                  <>
                    <ExternalLink className="size-3.5" />
                    测试连接
                  </>
                )}
              </Button>
            ) : (
              <Badge variant="outline" className="text-[11px] text-muted-foreground">
                IndexedDB 本地存储
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              取消
            </Button>
            <Button type="button" size="sm" onClick={handleSave} className="text-xs h-8 font-medium">
              保存配置
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
