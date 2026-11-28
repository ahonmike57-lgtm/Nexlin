import { NextRequest, NextResponse } from "next/server"
import { requireTenantAuth } from "@/lib/permissions"
import { db } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"

const ALLOWED_MEDIA_TYPES: Record<string, { ext: string; allowedInputExts: string[] }> = {
  "image/png": { ext: ".png", allowedInputExts: [".png"] },
  "image/jpeg": { ext: ".jpg", allowedInputExts: [".jpg", ".jpeg"] },
  "image/webp": { ext: ".webp", allowedInputExts: [".webp"] },
  "image/gif": { ext: ".gif", allowedInputExts: [".gif"] },
  "application/pdf": { ext: ".pdf", allowedInputExts: [".pdf"] },
  "text/plain": { ext: ".txt", allowedInputExts: [".txt"] },
  "text/csv": { ext: ".csv", allowedInputExts: [".csv"] },
  "audio/mpeg": { ext: ".mp3", allowedInputExts: [".mp3"] },
  "audio/mp3": { ext: ".mp3", allowedInputExts: [".mp3"] },
  "audio/wav": { ext: ".wav", allowedInputExts: [".wav"] },
  "audio/x-wav": { ext: ".wav", allowedInputExts: [".wav"] },
  "video/mp4": { ext: ".mp4", allowedInputExts: [".mp4"] },
  "video/webm": { ext: ".webm", allowedInputExts: [".webm"] },
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireTenantAuth("user")
    if (!auth.authorized || !auth.agencyId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const agencyId = auth.agencyId
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const rawFolder = ((formData.get("folder") as string) || "general").trim()
    const folder = /^[a-zA-Z0-9_-]{1,40}$/.test(rawFolder) ? rawFolder : "general"

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    const mimeType = (file.type || "").toLowerCase().trim()
    const allowedSpec = ALLOWED_MEDIA_TYPES[mimeType]
    if (!allowedSpec) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported file type. Allowed types: PNG, JPEG, WebP, GIF, PDF, TXT, CSV, MP3, WAV, MP4, WebM.",
        },
        { status: 400 }
      )
    }

    const inputExt = path.extname(file.name).toLowerCase()
    if (inputExt && !allowedSpec.allowedInputExts.includes(inputExt)) {
      return NextResponse.json(
        { success: false, error: "File extension does not match declared MIME type." },
        { status: 400 }
      )
    }

    // Max 25MB
    const MAX_SIZE = 25 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File exceeds 25MB limit" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Always write using the canonical allowlisted extension, never raw user extension
    const canonicalExt = allowedSpec.ext
    const baseName =
      path
        .basename(file.name, path.extname(file.name))
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-")
        .slice(0, 40) || "asset"
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`
    const safeFileName = `${baseName}-${uniqueSuffix}${canonicalExt}`

    let publicUrl = ""
    const uploadsDir = path.join(process.cwd(), "public", "uploads", agencyId)
    const filePath = path.join(uploadsDir, safeFileName)

    if (process.env.VERCEL !== "1") {
      try {
        await mkdir(uploadsDir, { recursive: true })
        await writeFile(filePath, buffer)
        publicUrl = `/uploads/${agencyId}/${safeFileName}`
      } catch (fsErr: any) {
        const code = fsErr?.code
        if (code !== "EROFS" && code !== "EACCES" && code !== "EPERM") {
          throw fsErr
        }
      }
    }

    if (!publicUrl) {
      const SERVERLESS_MAX_BYTES = 4 * 1024 * 1024
      if (file.size > SERVERLESS_MAX_BYTES) {
        return NextResponse.json(
          { success: false, error: "File exceeds 4MB limit in serverless mode." },
          { status: 400 }
        )
      }
      publicUrl = `data:${mimeType};base64,${buffer.toString("base64")}`
    }

    // Save metadata in database
    const mediaFile = await db.mediaFile.create({
      data: {
        agencyId,
        name: path.basename(file.name).slice(0, 200),
        size: file.size,
        type: mimeType,
        url: publicUrl,
        folder,
      },
    })

    return NextResponse.json({
      success: true,
      file: mediaFile,
      url: publicUrl,
    })
  } catch (error: any) {
    console.error("Media Upload API Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file" },
      { status: 500 }
    )
  }
}
