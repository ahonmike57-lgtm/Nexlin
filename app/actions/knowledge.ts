"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

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

export async function createKnowledgeArticle(agencyId: string, data: any) {
  try {
    const article = await db.knowledgeArticle.create({
      data: {
        ...data,
        agencyId,
      },
    })
    revalidatePath("/support/knowledge-base")
    return { success: true, article }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
