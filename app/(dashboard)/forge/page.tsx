export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ForgeBuilderClient } from "@/components/forge/ForgeBuilderClient"

export default async function ForgePage() {
  const session = await getSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { getOrCreateAgency } = await import("@/app/actions/agency")
  const agencyId = await getOrCreateAgency()

  const site = await db.forgeSite.findFirst({
    where: { agencyId },
    include: { pages: true }
  })

  const page = site?.pages?.[0] || null

  return <ForgeBuilderClient initialSite={site} initialPage={page} />
}
