import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendSMS } from "@/app/actions/telephony"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { funnelId, siteId, fullName, email, phone, monthlyIncome, formName } = body

    if (!email && !phone) {
      return NextResponse.json({ error: "Email or Phone is required" }, { status: 400 })
    }

    // Find site to get agencyId tenant scope
    const site = siteId ? await db.forgeSite.findUnique({ where: { id: siteId } }) : null
    const agencyId = site?.agencyId || (await db.agency.findFirst())?.id

    if (!agencyId) {
      return NextResponse.json({ error: "Agency tenant scope missing" }, { status: 400 })
    }

    const cleanEmail = email ? email.trim().toLowerCase() : `lead-${Date.now()}@nexlin.site`
    const names = (fullName || "Lead").trim().split(" ")
    const firstName = names[0]
    const lastName = names.slice(1).join(" ") || ""

    // 1. Ingest/Upsert directly into NEXLIN Core Contact table
    let contact = await db.contact.findFirst({
      where: { agencyId, email: cleanEmail }
    })

    if (!contact) {
      contact = await db.contact.create({
        data: {
          agencyId,
          firstName,
          lastName,
          email: cleanEmail,
          phone: phone || undefined,
          leadScore: 50
        }
      })
    } else {
      contact = await db.contact.update({
        where: { id: contact.id },
        data: {
          phone: phone || contact.phone,
          leadScore: (contact.leadScore || 0) + 25
        }
      })
    }

    // 2. Log in ForgeLead table
    if (funnelId) {
      await db.forgeLead.create({
        data: {
          funnelId,
          contactId: contact.id,
          payload: JSON.stringify({ fullName, email, phone, monthlyIncome, formName, submittedAt: new Date().toISOString() })
        }
      })
    }

    // 3. Trigger Call Porter 60-Second Callback Alert to Agency Owner
    const owner = await db.user.findFirst({
      where: { agencyId, role: "Agency Owner" }
    })

    if (owner?.id) {
      await sendSMS(owner.id, `🚀 Hot Forge Lead Captured: ${firstName} ${lastName} (${phone || email}) applied for ${formName || 'Pre-Qual'}. Call Porter callback triggered!`)
    }

    return NextResponse.json({
      success: true,
      message: "Lead ingested into NEXLIN CRM & Call Porter triggered!",
      contactId: contact.id
    })
  } catch (error: any) {
    console.error("Forge Lead Ingest Error:", error)
    return NextResponse.json({ error: error.message || "Failed to ingest lead" }, { status: 500 })
  }
}
