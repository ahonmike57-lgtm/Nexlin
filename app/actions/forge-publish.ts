"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { generateLocalBusinessSchema } from "@/lib/schema-markup"
import { revalidatePath } from "next/cache"

export async function publishForgeSite(siteId: string, customDomain?: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const site = await db.forgeSite.findFirst({
      where: { id: siteId, agencyId: auth.agencyId },
      include: { pages: true }
    })

    if (!site) return { success: false, error: "Site not found" }

    const targetDomain = customDomain ? customDomain.trim().toLowerCase() : site.domain || `${site.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.nexlin.site`

    // Generate JSON-LD Schema
    const schemaJson = generateLocalBusinessSchema({
      name: site.name,
      url: `https://${targetDomain}`
    })

    // Update site status to published
    const updatedSite = await db.forgeSite.update({
      where: { id: site.id },
      data: {
        domain: targetDomain,
        status: "published"
      }
    })

    // Update pages with SEO metadata & schema
    for (const p of site.pages) {
      await db.forgePage.update({
        where: { id: p.id },
        data: {
          seoMeta: JSON.stringify({
            title: `${site.name} | Official Website`,
            description: `Official site for ${site.name}. Browse inventory, apply for financing, and book service online.`,
            ogImage: "https://nexlin.site/og-default.jpg",
            jsonLd: schemaJson
          })
        }
      })
    }

    revalidatePath("/forge")
    return { success: true, site: updatedSite, liveUrl: `https://${targetDomain}` }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
