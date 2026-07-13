"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Folder, Image as ImageIcon, FileText, Video, MoreVertical, Trash2, Link as LinkIcon, Download } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { uploadMockMedia, deleteMediaFile } from "@/app/actions/media"
import { toast } from "sonner"

export default function MediaClient({ initialFiles, agencyId }: { initialFiles: any[], agencyId: string }) {
  const [files, setFiles] = useState(initialFiles)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    setUploading(true)
    // Mock upload
    const mockName = `uploaded-asset-${Math.floor(Math.random() * 1000)}.jpg`
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

      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        <Button variant="outline" className="gap-2 shrink-0">
          <Folder className="w-4 h-4" /> All Files
        </Button>
        <Button variant="ghost" className="gap-2 shrink-0 text-text-secondary">
          <ImageIcon className="w-4 h-4" /> Images
        </Button>
        <Button variant="ghost" className="gap-2 shrink-0 text-text-secondary">
          <Video className="w-4 h-4" /> Videos
        </Button>
        <Button variant="ghost" className="gap-2 shrink-0 text-text-secondary">
          <FileText className="w-4 h-4" /> Documents
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {files.map((file) => (
          <Card key={file.id} className="overflow-hidden hover:border-primary/50 transition-colors group">
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
                    <DropdownMenuItem className="gap-2">
                      <LinkIcon className="w-4 h-4" /> Get Link
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <Download className="w-4 h-4" /> Download
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-error" onClick={() => handleDelete(file.id)}>
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
                <span className="uppercase">{file.type.split('/')[1] || 'FILE'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {files.length === 0 && (
          <div className="col-span-full py-12 text-center text-text-secondary">
            No files uploaded yet.
          </div>
        )}
      </div>
    </div>
  )
}
