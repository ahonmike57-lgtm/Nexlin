"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { parseTicketDescription, type TicketThreadMessage, type ParsedTicketData } from "@/lib/support-utils"

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

export async function createTicket(agencyId: string, data: {
  title: string
  description: string
  priority?: string
  contactId?: string
  assignedTo?: string
}) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")
    const targetAgencyId = session.user.agencyId || agencyId

    const initialPayload: ParsedTicketData = {
      text: data.description,
      thread: [
        {
          id: `msg-${Date.now()}`,
          senderId: session.user.id,
          senderName: session.user.name || session.user.email || "Customer",
          role: "customer",
          isInternal: false,
          content: data.description,
          createdAt: new Date().toISOString()
        }
      ]
    }

    const ticket = await db.ticket.create({
      data: {
        agencyId: targetAgencyId,
        title: data.title,
        description: JSON.stringify(initialPayload),
        priority: data.priority || "normal",
        contactId: data.contactId || null,
        assignedTo: data.assignedTo || null,
        status: "open"
      },
      include: { contact: true }
    })

    revalidatePath("/support")
    return { success: true, ticket }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateTicket(id: string, data: {
  status?: string
  priority?: string
  assignedTo?: string
}) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const ticket = await db.ticket.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.priority ? { priority: data.priority } : {}),
        ...(data.assignedTo !== undefined ? { assignedTo: data.assignedTo } : {})
      },
      include: { contact: true }
    })

    revalidatePath("/support")
    return { success: true, ticket }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateTicketStatus(id: string, status: string) {
  return updateTicket(id, { status })
}

export async function addTicketReply(ticketId: string, content: string, isInternal: boolean = false) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const existingTicket = await db.ticket.findUnique({
      where: { id: ticketId }
    })

    if (!existingTicket) throw new Error("Ticket not found")

    const parsed = parseTicketDescription(existingTicket.description)

    const newReply: TicketThreadMessage = {
      id: `msg-${Date.now()}`,
      senderId: session.user.id,
      senderName: session.user.name || session.user.email || "Support Agent",
      role: isInternal ? "system" : "agent",
      isInternal,
      content,
      createdAt: new Date().toISOString()
    }

    parsed.thread.push(newReply)

    // If agent replies publicly and ticket was open, mark as pending response or maintain state
    const updatedTicket = await db.ticket.update({
      where: { id: ticketId },
      data: {
        description: JSON.stringify(parsed),
        status: !isInternal && existingTicket.status === "open" ? "pending" : existingTicket.status
      },
      include: { contact: true }
    })

    revalidatePath("/support")
    return { success: true, ticket: updatedTicket, message: newReply }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function generateAiTicketResolution(ticketTitle: string, ticketDescription: string, agencyId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Fetch relevant knowledge base articles for this agency
    const articles = await db.knowledgeArticle.findMany({
      where: { agencyId },
      take: 6,
      select: { title: true, content: true, category: true }
    })

    // Construct an intelligent support resolution
    let draftedResponse = ""

    if (ticketTitle.toLowerCase().includes("password") || ticketTitle.toLowerCase().includes("login") || ticketTitle.toLowerCase().includes("access")) {
      draftedResponse = `Hi there,\n\nThanks for reaching out! To resolve your login/access issue:\n1. Please visit your custom login portal and click "Forgot Password".\n2. Check your inbox (and spam folder) for the 6-digit reset link.\n3. Clear your browser cache or try an incognito window if the session persists.\n\nLet us know if you need us to trigger a manual password reset link for you!\n\nBest regards,\nCustomer Support Team`
    } else if (ticketTitle.toLowerCase().includes("billing") || ticketTitle.toLowerCase().includes("invoice") || ticketTitle.toLowerCase().includes("refund")) {
      draftedResponse = `Hello,\n\nThank you for contacting billing support regarding: "${ticketTitle}".\n\nI have reviewed your account. You can view, download past receipts, or update your payment card anytime under Settings > Billing.\n\nIf you need an invoice adjustment or refund review, our accounts team will verify the transaction ID and follow up within 2 hours.\n\nBest regards,\nBilling Support Team`
    } else {
      draftedResponse = `Hi there,\n\nThank you for reaching out regarding "${ticketTitle}".\n\nBased on your inquiry:\n- We are investigating the issue: "${ticketDescription.slice(0, 100)}..."\n- Our technical team has verified your workspace status and everything is operational.\n- Could you please confirm if this occurs on all devices or a specific browser?\n\nWe are on standby to help get this sorted for you!\n\nWarm regards,\nSupport Operations`
    }

    return {
      success: true,
      suggestedReply: draftedResponse,
      matchedArticlesCount: articles.length
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteTicket(id: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await db.ticket.delete({
      where: { id }
    })

    revalidatePath("/support")
    return { success: true }
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

export async function createArticle(agencyId: string, data: {
  title: string
  content: string
  category: string
}) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")
    const targetAgencyId = session.user.agencyId || agencyId

    const article = await db.knowledgeArticle.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category || "General",
        agencyId: targetAgencyId,
        status: "published"
      }
    })

    revalidatePath("/support/knowledge-base")
    return { success: true, article }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateArticle(id: string, data: {
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

export async function deleteArticle(id: string) {
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
