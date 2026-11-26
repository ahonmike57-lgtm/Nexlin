"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireTenantAuth } from "@/lib/permissions"
import { parseTicketDescription, type TicketThreadMessage, type ParsedTicketData } from "@/lib/support-utils"
import { generateAiReply } from "./ai"

export async function getTickets(_agencyId?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const tickets = await db.ticket.findMany({
      where: { agencyId: auth.agencyId },
      include: { contact: true },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, tickets }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createTicket(_agencyId: string, data: {
  title: string
  description: string
  priority?: string
  contactId?: string
  assignedTo?: string
}) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    let validContactId: string | null = null
    if (data.contactId) {
      const contact = await db.contact.findFirst({
        where: { id: data.contactId, agencyId: auth.agencyId },
        select: { id: true }
      })
      if (!contact) {
        return { success: false, error: "Contact not found" }
      }
      validContactId = contact.id
    }

    const sessionUser = auth.session?.user as any
    const initialPayload: ParsedTicketData = {
      text: data.description,
      thread: [
        {
          id: `msg-${Date.now()}`,
          senderId: auth.userId,
          senderName: sessionUser?.name || sessionUser?.email || "Customer",
          role: "customer",
          isInternal: false,
          content: data.description,
          createdAt: new Date().toISOString()
        }
      ]
    }

    const ticket = await db.ticket.create({
      data: {
        agencyId: auth.agencyId,
        title: data.title,
        description: JSON.stringify(initialPayload),
        priority: data.priority || "normal",
        contactId: validContactId,
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
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const existing = await db.ticket.findFirst({
      where: { id, agencyId: auth.agencyId },
      select: { id: true }
    })

    if (!existing) {
      return { success: false, error: "Ticket not found" }
    }

    const ticket = await db.ticket.update({
      where: { id: existing.id },
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
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const existingTicket = await db.ticket.findFirst({
      where: { id: ticketId, agencyId: auth.agencyId }
    })

    if (!existingTicket) {
      return { success: false, error: "Ticket not found" }
    }

    const parsed = parseTicketDescription(existingTicket.description)
    const sessionUser = auth.session?.user as any

    const newReply: TicketThreadMessage = {
      id: `msg-${Date.now()}`,
      senderId: auth.userId,
      senderName: sessionUser?.name || sessionUser?.email || "Support Agent",
      role: isInternal ? "system" : "agent",
      isInternal,
      content,
      createdAt: new Date().toISOString()
    }

    parsed.thread.push(newReply)

    const updatedTicket = await db.ticket.update({
      where: { id: existingTicket.id },
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

export async function generateAiTicketResolution(ticketTitle: string, ticketDescription: string, _agencyId?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const articles = await db.knowledgeArticle.findMany({
      where: { agencyId: auth.agencyId },
      take: 6,
      select: { title: true, content: true, category: true }
    })

    const kbContext =
      articles.length > 0
        ? articles
            .map((a, idx) => `${idx + 1}. [${a.category}] ${a.title}: ${a.content.slice(0, 350)}`)
            .join("\n")
        : "No agency knowledge base articles available."

    const prompt = `Draft a clear, empathetic, accurate customer support reply for the ticket below.

Ticket Subject: ${ticketTitle}
Ticket Details: ${ticketDescription}

Agency Knowledge Base Context:
${kbContext}

Provide numbered troubleshooting or next steps when helpful. Keep the tone concise and professional.`

    const res = await generateAiReply("support", prompt)
    if (!res.success || !res.data) {
      return { success: false, error: res.error || "AI resolution unavailable" }
    }

    return {
      success: true,
      suggestedReply: res.data,
      matchedArticlesCount: articles.length
    }
  } catch (error: any) {
    return { success: false, error: error.message || "AI resolution unavailable" }
  }
}

export async function deleteTicket(id: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const deleted = await db.ticket.deleteMany({
      where: { id, agencyId: auth.agencyId }
    })

    if (deleted.count === 0) {
      return { success: false, error: "Ticket not found" }
    }

    revalidatePath("/support")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getArticles(_agencyId?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const articles = await db.knowledgeArticle.findMany({
      where: { agencyId: auth.agencyId },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, articles }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createArticle(_agencyId: string, data: {
  title: string
  content: string
  category: string
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
      return { success: false, error: "Article not found" }
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

export async function deleteArticle(id: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const deleted = await db.knowledgeArticle.deleteMany({
      where: { id, agencyId: auth.agencyId }
    })

    if (deleted.count === 0) {
      return { success: false, error: "Article not found" }
    }

    revalidatePath("/support/knowledge-base")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
