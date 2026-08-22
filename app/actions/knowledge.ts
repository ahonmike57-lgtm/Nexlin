"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"

export async function getKnowledgeArticles(agencyId: string) {
  try {
    const articles = await db.knowledgeArticle.findMany({
      where: { agencyId },
      orderBy: {
        createdAt: "desc",
      },
    })
    return { success: true, articles }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createKnowledgeArticle(agencyId: string, data: {
  title: string
  content: string
  category?: string
  authorId?: string
}) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const article = await db.knowledgeArticle.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category || "General",
        agencyId,
        status: "published"
      },
    })
    revalidatePath("/support/knowledge-base")
    return { success: true, article }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateKnowledgeArticle(id: string, data: {
  title?: string
  content?: string
  category?: string
}) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const article = await db.knowledgeArticle.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.content ? { content: data.content } : {}),
        ...(data.category ? { category: data.category } : {})
      }
    })
    revalidatePath("/support/knowledge-base")
    return { success: true, article }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteKnowledgeArticle(id: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await db.knowledgeArticle.delete({
      where: { id }
    })
    revalidatePath("/support/knowledge-base")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
