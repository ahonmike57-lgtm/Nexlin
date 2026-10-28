"use server"

import { revalidatePath } from "next/cache"
import { db as prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function getMediaFiles(agencyId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const files = await prisma.mediaFile.findMany({
      where: { agencyId: session.user.agencyId || agencyId },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, files }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function uploadMediaFile(agencyId: string, data: {
  name: string
  size: number
  type: string
  url: string
}) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")
    const targetAgencyId = session.user.agencyId || agencyId

    const file = await prisma.mediaFile.create({
      data: {
        agencyId: targetAgencyId,
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

import { unlink } from "fs/promises"
import path from "path"

export async function deleteMediaFile(fileId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Retrieve file before deleting to remove from disk if local
    const file = await prisma.mediaFile.findUnique({
      where: { id: fileId }
    })

    if (file && file.url.startsWith("/uploads/")) {
      const localFilePath = path.join(process.cwd(), "public", file.url)
      await unlink(localFilePath).catch(() => {})
    }

    await prisma.mediaFile.deleteMany({
      where: { 
        id: fileId,
        ...(session.user.agencyId ? { agencyId: session.user.agencyId } : {})
      }
    })
    
    revalidatePath("/media")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
