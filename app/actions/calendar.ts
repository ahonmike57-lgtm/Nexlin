"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { getActiveSubAccountId } from "./subaccounts"
import { triggerWorkflows } from "./workflow-engine"
import { Resend } from "resend"
import { format } from "date-fns"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy")

/**
 * Generate standard RFC 5545 iCalendar (.ics) string for Google/Apple/Outlook integration.
 */
function generateIcsContent(event: {
  id: string
  title: string
  startTime: Date
  endTime: Date
  agencyName: string
  description?: string
}): string {
  const formatDateUtc = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  const startStr = formatDateUtc(new Date(event.startTime))
  const endStr = formatDateUtc(new Date(event.endTime))
  const nowStr = formatDateUtc(new Date())

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nexlin GHL//Calendar Engine//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${event.id}@nexlin.site`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description || `Appointment with ${event.agencyName}`}`,
    `ORGANIZER;CN=${event.agencyName}:mailto:appointments@nexlin.site`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}

/**
 * Create Appointment with strict double-booking conflict detection and RFC 5545 invite generation.
 */
export async function createAppointment(
  agencyId: string,
  data: { title: string; contactId: string; startTime: Date; endTime: Date }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const subAgencyId = await getActiveSubAccountId()
    const start = new Date(data.startTime)
    const end = new Date(data.endTime)

    if (start >= end) {
      return { success: false, error: "End time must be after start time." }
    }

    // 1. Conflict Detection: Check for overlapping appointments
    const conflict = await db.appointment.findFirst({
      where: {
        agencyId,
        subAgencyId: subAgencyId || null,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    })

    if (conflict) {
      return {
        success: false,
        error: "This time slot is already booked. Please choose a different date or time.",
      }
    }

    // 2. Persist Appointment in Database
    const appointment = await db.appointment.create({
      data: {
        title: data.title,
        contactId: data.contactId,
        startTime: start,
        endTime: end,
        agencyId,
        subAgencyId,
      },
      include: { contact: true },
    })

    const contact = appointment.contact
    const agency = await db.agency.findUnique({ where: { id: agencyId } })
    const agencyName = agency?.name || "Our Team"
    const contactName = contact ? `${contact.firstName} ${contact.lastName || ""}`.trim() : "Valued Client"

    // 3. Create Persistent In-App Notification
    await db.notification.create({
      data: {
        agencyId,
        type: "appointment_booked",
        title: "📅 New Appointment Booked",
        body: `${contactName} booked "${data.title}" for ${format(start, "MMM d, h:mm a")}`,
        link: "/calendar",
      },
    }).catch(() => {})

    // 4. Trigger Automated Workflows
    await triggerWorkflows(agencyId, "appointment_booked", {
      appointmentId: appointment.id,
      contactId: appointment.contactId,
      title: appointment.title,
      startTime: appointment.startTime.toISOString(),
      endTime: appointment.endTime.toISOString(),
    }).catch(() => {})

    // 5. Send Confirmation Email with RFC 5545 .ics Calendar Attachment
    if (contact?.email && process.env.RESEND_API_KEY) {
      const dateStr = format(start, "EEEE, MMMM d, yyyy")
      const timeStr = format(start, "h:mm a")
      const endTimeStr = format(end, "h:mm a")
      const icsContent = generateIcsContent({
        id: appointment.id,
        title: data.title,
        startTime: start,
        endTime: end,
        agencyName,
      })

      await resend.emails.send({
        from: `${agencyName} <onboarding@resend.dev>`,
        to: [contact.email],
        subject: `Appointment Confirmed: ${data.title}`,
        attachments: [
          {
            filename: "invite.ics",
            content: Buffer.from(icsContent).toString("base64"),
          },
        ],
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
              <p style="color: #555;">The calendar invite (.ics) has been attached to this email for 1-click addition to your calendar.</p>
              <p style="color: #555; margin-top: 32px;">See you soon,<br/><strong>${agencyName}</strong></p>
            </div>
          </div>
        `,
      }).catch((err) => console.warn("[Calendar] Confirmation email failed:", err))
    }

    revalidatePath("/calendar")
    return { success: true, data: appointment }
  } catch (error: any) {
    console.error("Failed to create appointment:", error)
    return { success: false, error: error.message || "Failed to create appointment" }
  }
}
