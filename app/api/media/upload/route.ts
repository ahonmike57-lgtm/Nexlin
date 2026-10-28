import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const agencyId = (session.user as any).agencyId
    if (!agencyId) {
      return NextResponse.json({ success: false, error: "Agency ID required" }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || "general"

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
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

    // Generate safe unique filename
    const ext = path.extname(file.name) || ".bin"
    const baseName = path
      .basename(file.name, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .slice(0, 40)
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    const safeFileName = `${baseName}-${uniqueSuffix}${ext}`

    // Target upload directory in public/uploads/<agencyId>
    const uploadsDir = path.join(process.cwd(), "public", "uploads", agencyId)
    await mkdir(uploadsDir, { recursive: true })

    const filePath = path.join(uploadsDir, safeFileName)
    await writeFile(filePath, buffer)

    const publicUrl = `/uploads/${agencyId}/${safeFileName}`

    // Save metadata in database
    const mediaFile = await db.mediaFile.create({
      data: {
        agencyId,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        url: publicUrl,
        folder
      }
    })

    return NextResponse.json({
      success: true,
      file: mediaFile,
      url: publicUrl
    })
  } catch (error: any) {
    console.error("Media Upload API Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file" },
      { status: 500 }
    )
  }
}
