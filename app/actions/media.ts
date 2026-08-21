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

export async function uploadMockMedia(agencyId: string, name: string, size: number, type: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")
    const targetAgencyId = session.user.agencyId || agencyId

    const mockUrl = `https://storage.example.com/${targetAgencyId}/${name}`
    
    const file = await prisma.mediaFile.create({
      data: {
        agencyId: targetAgencyId,
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
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

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
