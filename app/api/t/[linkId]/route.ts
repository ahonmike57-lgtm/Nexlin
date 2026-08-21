import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { triggerWorkflows } from "@/app/actions/workflow-engine"
import { pusherServer } from "@/lib/pusher"

export async function GET(request: Request, { params }: { params: Promise<{ linkId: string }> }) {
  try {
    const { linkId } = await params
    const requestUrl = new URL(request.url)
    const contactId = requestUrl.searchParams.get("contactId") || requestUrl.searchParams.get("c")

    const link = await db.snapshot.findUnique({
      where: { id: linkId }
    })

    if (!link || link.version !== "trigger_link" || !link.description) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    const data = JSON.parse(link.description)
    const targetUrl = data.targetUrl || "/"

    // 1. Increment click count on trigger link
    await db.snapshot.update({
      where: { id: linkId },
      data: {
        description: JSON.stringify({
          ...data,
          clickCount: (data.clickCount || 0) + 1,
          lastClickedAt: new Date().toISOString()
        })
      }
    })

    // 2. Attribution & Lead Scoring (if contactId present)
    if (contactId) {
      const contact = await db.contact.findFirst({
        where: { id: contactId, agencyId: link.agencyId }
      })

      if (contact) {
        // Boost lead score by 20 points
        await db.contact.update({
          where: { id: contact.id },
          data: {
            leadScore: (contact.leadScore || 0) + 20
          }
        })

        // Create persistent notification for the agency sales team
        await db.notification.create({
          data: {
            agencyId: link.agencyId,
            type: "trigger_link_clicked",
            title: "🔥 High-Intent Link Clicked",
            body: `${contact.firstName} ${contact.lastName || ""} clicked "${link.name}" (+20 Lead Score)`,
            link: `/crm/contacts`
          }
        }).catch(() => {})

        // Trigger active automations
        await triggerWorkflows(link.agencyId, "trigger_link_clicked", {
          linkId,
          linkName: link.name,
          contactId: contact.id,
          targetUrl
        }).catch(() => {})

        // Push real-time toast to active agency users
        try {
          await pusherServer.trigger(`agency-${link.agencyId}`, "lead-activity", {
            type: "trigger_link_click",
            contactName: `${contact.firstName} ${contact.lastName || ""}`.trim(),
            linkName: link.name
          })
        } catch {}
      }
    }

    return NextResponse.redirect(targetUrl)
  } catch (error) {
    console.error("Trigger link redirect error:", error)
    return NextResponse.redirect(new URL("/", request.url))
  }
}
