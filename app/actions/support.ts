"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getTickets(agencyId: string) {
  try {
    const tickets = await db.ticket.findMany({
      where: { agencyId },
      orderBy: { updatedAt: "desc" },
      include: {
        contact: true
      }
    })
    return { success: true, tickets }
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return { success: false, error: "Failed to fetch tickets" }
  }
}

export async function createTicket(agencyId: string, data: any) {
  try {
    const ticket = await db.ticket.create({
      data: {
        agencyId,
        title: data.title,
        description: data.description,
        status: data.status || "open",
        priority: data.priority || "normal",
        contactId: data.contactId || null,
      }
    })
    revalidatePath("/support")
    return { success: true, ticket }
  } catch (error) {
    console.error("Error creating ticket:", error)
    return { success: false, error: "Failed to create ticket" }
  }
}

export async function updateTicketStatus(ticketId: string, status: string) {
  try {
    const ticket = await db.ticket.update({
      where: { id: ticketId },
      data: { status }
    })
    revalidatePath("/support")
    return { success: true, ticket }
  } catch (error) {
    console.error("Error updating ticket:", error)
    return { success: false, error: "Failed to update ticket" }
  }
}
