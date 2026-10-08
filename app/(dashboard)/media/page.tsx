export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { db as prisma } from "@/lib/db"
import { getMediaFiles } from "@/app/actions/media"
import { getOrCreateAgency } from "@/app/actions/agency"
import MediaClient from "./MediaClient"
import { redirect } from "next/navigation"

export default async function MediaPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const agencyId = await getOrCreateAgency()

  const res = await getMediaFiles(agencyId)
  let files = res.success && res.files ? res.files : []

  // Return real agency media files
  return <MediaClient initialFiles={files} agencyId={agencyId} />
}

