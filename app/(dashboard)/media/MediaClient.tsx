"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  Folder,
  Image as ImageIcon,
  FileText,
  Video,
  MoreVertical,
  Trash2,
  Link as LinkIcon,
  Download,
  Check,
  Search,
  Eye,
  Loader2,
  HardDrive,
  Plus
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { uploadMediaFile, deleteMediaFile } from "@/app/actions/media"
import { toast } from "sonner"
import { format } from "date-fns"

interface MediaItem {
  id: string
  name: string
  size: number
  type: string
  url: string
  createdAt: any
}

export default function MediaClient({ initialFiles, agencyId }: { initialFiles: MediaItem[], agencyId: string }) {
  const [files, setFiles] = useState<MediaItem[]>(initialFiles)
  const [filterType, setFilterType] = useState<"all" | "image" | "video" | "doc">("all")
  const [search, setSearch] = useState("")
  const [uploading, setUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState<MediaItem | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    let uploadCount = 0

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]

      // Limit file size to 10MB for direct base64 storage
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB maximum size limit.`)
        continue
      }

      try {
        const dataUrl = await readFileAsDataUrl(file)
        const res = await uploadMediaFile(agencyId, {
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          url: dataUrl
        })

        if (res.success && res.file) {
          uploadCount++
          setFiles(prev => [res.file as any, ...prev])
        }
      } catch (err) {
        console.error("Error reading file", err)
      }
    }

    setUploading(false)
    if (uploadCount > 0) {
      toast.success(`Successfully uploaded ${uploadCount} asset${uploadCount > 1 ? "s" : ""}!`)
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
      reader.readAsDataURL(file)
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media asset?")) return

    if (id.startsWith("mock-")) {
      setFiles(files.filter(f => f.id !== id))
      toast.success("File deleted")
      return
    }

    const res = await deleteMediaFile(id)
    if (res.success) {
      setFiles(files.filter(f => f.id !== id))
      toast.success("File deleted")
    } else {
      toast.error(res.error || "Failed to delete file")
    }
  }

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success("File URL copied to clipboard!")
    setTimeout(() => setCopiedId(null), 2500)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const totalBytesUsed = files.reduce((acc, f) => acc + (f.size || 0), 0)

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false

    if (filterType === "image") return file.type?.startsWith("image")
    if (filterType === "video") return file.type?.startsWith("video")
    if (filterType === "doc") return file.type?.includes("pdf") || file.type?.includes("doc") || file.type?.includes("text")
    return true
  })

  const getFileIcon = (type: string) => {
    if (type?.startsWith("image")) return <ImageIcon className="w-8 h-8 text-blue-500" />
    if (type?.startsWith("video")) return <Video className="w-8 h-8 text-purple-500" />
    return <FileText className="w-8 h-8 text-amber-500" />
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hidden File Picker Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Media Library</h1>
          <p className="text-text-secondary text-sm mt-1">
            Store and manage images, videos, and marketing collateral for your funnels and websites.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-primary text-white"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? "Uploading..." : "Upload Media Asset"}
          </Button>
        </div>
      </div>

      {/* Storage Quota Card & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-border bg-bg-primary shadow-sm md:col-span-1">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
              <span className="flex items-center gap-1.5"><HardDrive className="w-4 h-4 text-primary" /> Storage Used</span>
              <span>{formatFileSize(totalBytesUsed)} / 10 GB</span>
            </div>
            <div className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${Math.min((totalBytesUsed / (10 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-text-secondary">CDN Accelerated asset hosting</p>
          </CardContent>
        </Card>

        <div className="md:col-span-3 rounded-xl border border-border bg-bg-primary p-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <Input
              placeholder="Search assets by filename..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-bg-secondary/40"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {(["all", "image", "video", "doc"] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  filterType === type
                    ? "bg-primary text-white"
                    : "bg-bg-secondary text-text-secondary hover:bg-border"
                }`}
              >
                {type === "all" ? "All Files" : `${type}s`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Media Assets */}
      {filteredFiles.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="rounded-2xl border-2 border-dashed border-border bg-bg-primary p-12 text-center cursor-pointer hover:border-primary transition-colors"
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-text-primary">Drag and Drop or Click to Upload</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
            Upload PNG, JPG, MP4, or PDF assets to use across your Funnel Builder, Email Campaigns, and CMS Blogs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredFiles.map(file => {
            const isImage = file.type?.startsWith("image")
            const isVideo = file.type?.startsWith("video")

            return (
              <div
                key={file.id}
                className="group relative rounded-2xl border border-border bg-bg-primary overflow-hidden shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                {/* Thumbnail / Preview Area */}
                <div
                  onClick={() => setPreviewFile(file)}
                  className="h-32 bg-bg-secondary/40 flex items-center justify-center overflow-hidden cursor-pointer relative"
                >
                  {isImage && file.url && file.url !== "#" ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2">
                      {getFileIcon(file.type)}
                      <span className="text-[10px] text-text-secondary uppercase font-bold mt-1">
                        {file.type?.split("/")[1] || "FILE"}
                      </span>
                    </div>
                  )}

                  {/* Hover Quick Action Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7 rounded-full bg-white/90 text-slate-800 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewFile(file)
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7 rounded-full bg-white/90 text-slate-800 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyLink(file.url, file.id)
                      }}
                    >
                      {copiedId === file.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <LinkIcon className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* File Details */}
                <div className="p-3">
                  <h4 className="text-xs font-bold text-text-primary truncate" title={file.name}>
                    {file.name}
                  </h4>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-text-secondary">
                    <span>{formatFileSize(file.size)}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-text-secondary hover:text-text-primary p-0.5">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                          <Eye className="w-3.5 h-3.5 mr-2" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyLink(file.url, file.id)}>
                          <LinkIcon className="w-3.5 h-3.5 mr-2" /> Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(file.id)} className="text-red-500">
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Asset Preview Modal */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="truncate">{previewFile.name}</DialogTitle>
            </DialogHeader>

            <div className="py-2 flex flex-col items-center justify-center max-h-[60vh] overflow-hidden">
              {previewFile.type?.startsWith("image") && previewFile.url && previewFile.url !== "#" ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-h-[50vh] w-auto object-contain rounded-xl border border-border"
                />
              ) : previewFile.type?.startsWith("video") && previewFile.url && previewFile.url !== "#" ? (
                <video
                  src={previewFile.url}
                  controls
                  className="max-h-[50vh] w-full rounded-xl border border-border"
                />
              ) : (
                <div className="p-12 text-center">
                  {getFileIcon(previewFile.type)}
                  <p className="text-sm font-semibold text-text-primary mt-3">{previewFile.name}</p>
                  <p className="text-xs text-text-secondary mt-1">{formatFileSize(previewFile.size)}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
              <span className="text-text-secondary">Size: {formatFileSize(previewFile.size)}</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyLink(previewFile.url, previewFile.id)}
                >
                  <LinkIcon className="w-3.5 h-3.5 mr-1.5" /> Copy CDN URL
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPreviewFile(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
