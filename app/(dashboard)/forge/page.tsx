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

  let site = await db.forgeSite.findFirst({
    where: { agencyId },
    include: { pages: true }
  })

  // Auto-provision initial ForgeSite and ForgePage on initial load
  if (!site) {
    site = await db.forgeSite.create({
      data: {
        agencyId,
        name: "Rodriguez Auto Sales",
        domain: `rodriguezauto-${Date.now().toString().slice(-4)}.nexlin.site`,
        status: "draft"
      },
      include: { pages: true }
    })
  }

  let page = site.pages?.[0] || null

  if (!page) {
    page = await db.forgePage.create({
      data: {
        siteId: site.id,
        slug: "home",
        componentTree: JSON.stringify([]),
        version: 1
      }
    })
    site = await db.forgeSite.findUnique({
      where: { id: site.id },
      include: { pages: true }
    }) || site
  }

  return <ForgeBuilderClient initialSite={site} initialPage={page} />
}
