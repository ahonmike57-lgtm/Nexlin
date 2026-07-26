import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { linkId: string } }) {
  try {
    const linkId = params.linkId

    const link = await db.snapshot.findUnique({
      where: { id: linkId }
    })

    if (!link || link.version !== "trigger_link" || !link.description) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    const data = JSON.parse(link.description)
    const targetUrl = data.targetUrl || "/"

    // Increment click count
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

    return NextResponse.redirect(targetUrl)
  } catch (error) {
    console.error("Trigger link redirect error:", error)
    return NextResponse.redirect(new URL("/", request.url))
  }
}
