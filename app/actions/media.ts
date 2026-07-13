"use server"

import { revalidatePath } from "next/cache"
import { db as prisma } from "@/lib/db"

export async function getMediaFiles(agencyId: string) {
  try {
    const files = await prisma.mediaFile.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, files }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function uploadMockMedia(agencyId: string, name: string, size: number, type: string) {
  try {
    const mockUrl = `https://storage.example.com/${agencyId}/${name}`
    
    const file = await prisma.mediaFile.create({
      data: {
        agencyId,
        name,
        size,
        type,
        url: mockUrl,
      }
    })

    revalidatePath("/media")
    return { success: true, file }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteMediaFile(fileId: string) {
  try {
    await prisma.mediaFile.delete({
      where: { id: fileId }
    })
    
    revalidatePath("/media")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
