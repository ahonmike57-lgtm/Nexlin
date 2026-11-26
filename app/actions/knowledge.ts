"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireTenantAuth } from "@/lib/permissions"

export async function getKnowledgeArticles(_agencyId?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const articles = await db.knowledgeArticle.findMany({
      where: { agencyId: auth.agencyId },
      orderBy: {
        createdAt: "desc",
      },
    })
    return { success: true, articles }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createKnowledgeArticle(_agencyId: string, data: {
  title: string
  content: string
  category?: string
  authorId?: string
}) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const article = await db.knowledgeArticle.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category || "General",
        agencyId: auth.agencyId,
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
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const existing = await db.knowledgeArticle.findFirst({
      where: { id, agencyId: auth.agencyId },
      select: { id: true }
    })

    if (!existing) {
      return { success: false, error: "Knowledge article not found" }
    }

    const article = await db.knowledgeArticle.update({
      where: { id: existing.id },
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
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const deleted = await db.knowledgeArticle.deleteMany({
      where: { id, agencyId: auth.agencyId }
    })

    if (deleted.count === 0) {
      return { success: false, error: "Knowledge article not found" }
    }

    revalidatePath("/support/knowledge-base")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
