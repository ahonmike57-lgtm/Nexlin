"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createAppointment(agencyId: string, data: { title: string, contactId: string, startTime: Date, endTime: Date }) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const appointment = await db.appointment.create({
      data: {
        title: data.title,
        contactId: data.contactId,
        startTime: data.startTime,
        endTime: data.endTime,
        agencyId,
      },
      include: {
        contact: true
      }
    })

    revalidatePath("/calendar")
    return { success: true, data: appointment }
  } catch (error) {
    console.error("Failed to create appointment:", error)
    return { success: false, error: "Failed to create appointment" }
  }
}
