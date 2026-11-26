import { db } from "@/lib/db"

// 1x1 transparent GIF buffer
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
)

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params

  try {
    if (trackingId && trackingId.includes("_")) {
      const [campaignId, contactId] = trackingId.split("_")

      if (campaignId && contactId) {
        const campaign = await db.campaign.findUnique({
          where: { id: campaignId },
          select: { id: true, agencyId: true },
        })

        if (campaign) {
          let isFirstOpen = false
          try {
            await db.processedEvent.create({
              data: {
                eventId: `email_open:${campaign.id}:${contactId}`,
                source: "email_open",
              },
            })
            isFirstOpen = true
          } catch {
            // Unique violation -> open already counted for this campaign/contact
          }

          if (isFirstOpen) {
            await db.contact
              .updateMany({
                where: { id: contactId, agencyId: campaign.agencyId, deletedAt: null },
                data: {
                  leadScore: { increment: 5 },
                  updatedAt: new Date(),
                },
              })
              .catch(() => {})
          }
        }
      }
    }
  } catch (error) {
    console.error("Open tracking error:", error)
  }

  return new Response(TRANSPARENT_GIF_BUFFER, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": TRANSPARENT_GIF_BUFFER.length.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  })
}
