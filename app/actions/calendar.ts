"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { getActiveSubAccountId } from "./subaccounts"
import { Resend } from "resend"
import { format } from "date-fns"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy")

export async function createAppointment(agencyId: string, data: { title: string, contactId: string, startTime: Date, endTime: Date }) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const subAgencyId = await getActiveSubAccountId()

    const appointment = await db.appointment.create({
      data: {
        title: data.title,
        contactId: data.contactId,
        startTime: data.startTime,
        endTime: data.endTime,
        agencyId,
        subAgencyId,
      },
      include: { contact: true }
    })

    // Send confirmation email to contact
    const contact = appointment.contact
    if (contact?.email && process.env.RESEND_API_KEY) {
      const agency = await db.agency.findUnique({ where: { id: agencyId } })
      const agencyName = agency?.name || "Our Team"
      const contactName = `${contact.firstName} ${contact.lastName || ""}`.trim()
      const dateStr = format(new Date(data.startTime), "EEEE, MMMM d, yyyy")
      const timeStr = format(new Date(data.startTime), "h:mm a")
      const endTimeStr = format(new Date(data.endTime), "h:mm a")

      await resend.emails.send({
        from: `${agencyName} <onboarding@resend.dev>`,
        to: [contact.email],
        subject: `Appointment Confirmed: ${data.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 12px; overflow: hidden;">
            <div style="background: #1A3CFF; padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">✅ Appointment Confirmed</h1>
            </div>
            <div style="padding: 32px; background: white;">
              <p style="color: #555; font-size: 16px;">Hi <strong>${contactName}</strong>,</p>
              <p style="color: #555;">Your appointment has been confirmed. Here are the details:</p>
              <div style="background: #f0f4ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 8px; font-weight: 600; color: #1A3CFF; font-size: 18px;">${data.title}</p>
                <p style="margin: 0 0 4px; color: #555;">📅 ${dateStr}</p>
                <p style="margin: 0; color: #555;">🕐 ${timeStr} – ${endTimeStr}</p>
              </div>
              <p style="color: #555;">If you need to reschedule or have any questions, please contact us directly.</p>
              <p style="color: #555; margin-top: 32px;">See you soon,<br/><strong>${agencyName}</strong></p>
            </div>
          </div>
        `
      }).catch(err => console.warn("[Calendar] Confirmation email failed:", err))
    }

    revalidatePath("/calendar")
    return { success: true, data: appointment }
  } catch (error) {
    console.error("Failed to create appointment:", error)
    return { success: false, error: "Failed to create appointment" }
  }
}
