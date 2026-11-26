"use server"

import { revalidatePath } from "next/cache"
import { unlink } from "fs/promises"
import path from "path"
import { db as prisma } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"

export async function getMediaFiles(_agencyId?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const files = await prisma.mediaFile.findMany({
      where: { agencyId: auth.agencyId },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, files }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function uploadMediaFile(_agencyId: string, data: {
  name: string
  size: number
  type: string
  url: string
}) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const file = await prisma.mediaFile.create({
      data: {
        agencyId: auth.agencyId,
        name: data.name,
        size: data.size,
        type: data.type,
        url: data.url,
      }
    })

    revalidatePath("/media")
    return { success: true, file }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteMediaFile(fileId: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const file = await prisma.mediaFile.findFirst({
      where: { id: fileId, agencyId: auth.agencyId }
    })

    if (!file) {
      return { success: false, error: "File not found" }
    }

    if (file.url.startsWith("/uploads/")) {
      const uploadsRoot = path.resolve(process.cwd(), "public", "uploads")
      const targetPath = path.resolve(process.cwd(), "public", file.url.replace(/^\/+/, ""))
      if (targetPath.startsWith(uploadsRoot + path.sep)) {
        await unlink(targetPath).catch(() => {})
      }
    }

    await prisma.mediaFile.deleteMany({
      where: {
        id: file.id,
        agencyId: auth.agencyId
      }
    })
    
    revalidatePath("/media")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
