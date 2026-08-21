"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Folder, Image as ImageIcon, FileText, Video, MoreVertical, Trash2, Link as LinkIcon, Download, Check } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { uploadMockMedia, deleteMediaFile } from "@/app/actions/media"
import { toast } from "sonner"

export default function MediaClient({ initialFiles, agencyId }: { initialFiles: any[], agencyId: string }) {
  const [files, setFiles] = useState(initialFiles)
  const [filterType, setFilterType] = useState<"all" | "image" | "video" | "doc">("all")
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    setUploading(true)
    const mockName = `asset-${Math.floor(Math.random() * 1000)}.jpg`
    const res = await uploadMockMedia(agencyId, mockName, 1024 * 500, "image/jpeg")
    setUploading(false)

    if (res.success) {
      toast.success("File uploaded successfully")
      setFiles([res.file, ...files])
    } else {
      toast.error(res.error || "Failed to upload file")
    }
  }

  const handleDelete = async (id: string) => {
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

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("File URL copied to clipboard!")
  }

  const handleDownload = (file: any) => {
    toast.success(`Starting download for ${file.name}...`)
    const a = document.createElement("a")
    a.href = file.url
    a.download = file.name
    a.target = "_blank"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return <ImageIcon className="w-8 h-8 text-blue-500" />
    if (type.includes("video")) return <Video className="w-8 h-8 text-purple-500" />
    if (type.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />
    return <FileText className="w-8 h-8 text-gray-500" />
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const filteredFiles = files.filter(f => {
    if (filterType === "all") return true
    if (filterType === "image") return f.type.includes("image")
    if (filterType === "video") return f.type.includes("video")
    if (filterType === "doc") return f.type.includes("pdf") || f.type.includes("document") || f.type.includes("text")
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-text-secondary text-sm">Manage all your images, videos, and documents.</p>
        </div>
        
        <Button onClick={handleUpload} disabled={uploading} className="gap-2">
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Upload File"}
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button 
          variant={filterType === "all" ? "default" : "ghost"} 
          size="sm"
          onClick={() => setFilterType("all")}
          className="gap-2 shrink-0"
        >
          <Folder className="w-4 h-4" /> All Files ({files.length})
        </Button>
        <Button 
          variant={filterType === "image" ? "default" : "ghost"} 
          size="sm"
          onClick={() => setFilterType("image")}
          className="gap-2 shrink-0"
        >
          <ImageIcon className="w-4 h-4" /> Images
        </Button>
        <Button 
          variant={filterType === "video" ? "default" : "ghost"} 
          size="sm"
          onClick={() => setFilterType("video")}
          className="gap-2 shrink-0"
        >
          <Video className="w-4 h-4" /> Videos
        </Button>
        <Button 
          variant={filterType === "doc" ? "default" : "ghost"} 
          size="sm"
          onClick={() => setFilterType("doc")}
          className="gap-2 shrink-0"
        >
          <FileText className="w-4 h-4" /> Documents
        </Button>
      </div>

      {/* File Grid */}
      {filteredFiles.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl">
          <Folder className="w-10 h-10 text-text-secondary mx-auto mb-2 opacity-40" />
          <h3 className="text-sm font-semibold text-text-primary">No files in this filter</h3>
          <p className="text-xs text-text-secondary mt-1">Upload a file or switch filters to view assets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="overflow-hidden hover:border-primary/50 transition-colors group bg-bg-primary">
              <div className="aspect-square bg-bg-secondary/50 flex items-center justify-center relative">
                {getFileIcon(file.type)}
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="w-8 h-8 bg-bg-primary/80 backdrop-blur-sm shadow-sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleCopyLink(file.url)}>
                        <LinkIcon className="w-4 h-4" /> Get Link
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleDownload(file)}>
                        <Download className="w-4 h-4" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-error cursor-pointer" onClick={() => handleDelete(file.id)}>
                        <Trash2 className="w-4 h-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                <div className="flex justify-between items-center mt-1 text-xs text-text-secondary">
                  <span>{formatSize(file.size)}</span>
                  <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
