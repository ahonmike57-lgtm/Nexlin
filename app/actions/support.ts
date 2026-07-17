"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getTickets(agencyId: string) {
  try {
    const tickets = await db.ticket.findMany({
      where: { agencyId },
      include: { contact: true },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, tickets }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createTicket(agencyId: string, data: any) {
  try {
    const ticket = await db.ticket.create({
      data: {
        ...data,
        agencyId,
      }
    })
    revalidatePath("/support")
    return { success: true, ticket }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateTicketStatus(id: string, status: string) {
  try {
    const ticket = await db.ticket.update({
      where: { id },
      data: { status }
    })
    revalidatePath("/support")
    return { success: true, ticket }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getArticles(agencyId: string) {
  try {
    const articles = await db.knowledgeArticle.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, articles }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createArticle(agencyId: string, data: any) {
  try {
    const article = await db.knowledgeArticle.create({
      data: {
        ...data,
        agencyId,
      }
    })
    revalidatePath("/support")
    return { success: true, article }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
