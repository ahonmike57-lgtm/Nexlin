export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db as prisma } from "@/lib/db"
import { getMediaFiles } from "@/app/actions/media"
import { getOrCreateAgency } from "@/app/actions/agency"
import MediaClient from "./MediaClient"
import { redirect } from "next/navigation"

export default async function MediaPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect("/login")

  const agencyId = await getOrCreateAgency()

  const res = await getMediaFiles(agencyId)
  let files = res.success && res.files ? res.files : []

  // Mock some initial data if empty
  if (files.length === 0) {
    files = [
      { id: "mock-1", name: "logo-transparent.png", size: 1024 * 450, type: "image/png", url: "#", createdAt: new Date() },
      { id: "mock-2", name: "summer-promo.mp4", size: 1024 * 1024 * 15, type: "video/mp4", url: "#", createdAt: new Date() },
      { id: "mock-3", name: "pricing-guide.pdf", size: 1024 * 2100, type: "application/pdf", url: "#", createdAt: new Date() }
    ] as any
  }

  return <MediaClient initialFiles={files} agencyId={agencyId} />
}

