"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

import { getSession } from "@/lib/auth"

export async function getTickets(agencyId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")
    const targetAgencyId = session.user.agencyId || agencyId

    const tickets = await db.ticket.findMany({
      where: { agencyId: targetAgencyId },
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
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")
    const targetAgencyId = session.user.agencyId || agencyId

    const ticket = await db.ticket.create({
      data: {
        ...data,
        agencyId: targetAgencyId,
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
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const ticket = await db.ticket.updateMany({
      where: { 
        id,
        ...(session.user.agencyId ? { agencyId: session.user.agencyId } : {})
      },
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
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")
    const targetAgencyId = session.user.agencyId || agencyId

    const articles = await db.knowledgeArticle.findMany({
      where: { agencyId: targetAgencyId },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, articles }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createArticle(agencyId: string, data: any) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")
    const targetAgencyId = session.user.agencyId || agencyId

    const article = await db.knowledgeArticle.create({
      data: {
        ...data,
        agencyId: targetAgencyId,
      }
    })
    revalidatePath("/support")
    return { success: true, article }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
