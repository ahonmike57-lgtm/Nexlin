export const dynamic = 'force-dynamic';
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ForgeBuilderClient } from "@/components/forge/ForgeBuilderClient"

export default async function ForgePage() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      redirect("/login")
    }

    let agencyId = (session.user as any).agencyId
    if (!agencyId) {
      const { getOrCreateAgency } = await import("@/app/actions/agency")
      agencyId = await getOrCreateAgency().catch(() => null)
    }

    let site: any = null
    let page: any = null

    if (agencyId) {
      site = await db.forgeSite.findFirst({
        where: { agencyId },
        include: { pages: true }
      }).catch(() => null)

      // Auto-provision initial ForgeSite and ForgePage on initial load if missing
      if (!site) {
        try {
          site = await db.forgeSite.create({
            data: {
              agencyId,
              name: "Rodriguez Auto Sales",
              domain: `rodriguezauto-${Date.now().toString().slice(-4)}.nexlin.site`,
              status: "draft"
            },
            include: { pages: true }
          })
        } catch {
          site = null
        }
      }

      page = site?.pages?.[0] || null

      if (site && !page) {
        try {
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
        } catch {
          page = null
        }
      }
    }

    return <ForgeBuilderClient initialSite={site} initialPage={page} />
  } catch (error) {
    console.error("ForgePage server render catch:", error)
    return <ForgeBuilderClient initialSite={null} initialPage={null} />
  }
}
