import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// 1x1 transparent GIF buffer
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
)

export async function GET(
  req: Request,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params

  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const userAgent = req.headers.get("user-agent") || "unknown"

    // Parse trackingId format: campaignId_contactId or general tracking string
    if (trackingId && trackingId.includes("_")) {
      const [campaignId, contactId] = trackingId.split("_")
      
      // Update contact lead score (+5 for opening email)
      if (contactId) {
        await db.contact.updateMany({
          where: { id: contactId },
          data: {
            leadScore: { increment: 5 },
            updatedAt: new Date()
          }
        }).catch(() => {})
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
