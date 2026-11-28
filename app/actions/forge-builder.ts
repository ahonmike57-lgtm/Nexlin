"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { generateForgeTask } from "@/lib/forge/forge-gateway"
import { revalidatePath } from "next/cache"

export async function createForgeSite(name: string, domain?: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const agencyId = auth.agencyId
    const cleanDomain = domain
      ? domain.trim().toLowerCase()
      : `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}.nexlin.site`

    const site = await db.forgeSite.create({
      data: {
        agencyId,
        name: name.trim(),
        domain: cleanDomain,
        status: "draft",
      },
    })

    const page = await db.forgePage.create({
      data: {
        siteId: site.id,
        slug: "home",
        componentTree: JSON.stringify([]),
        version: 1,
      },
    })

    revalidatePath("/forge")
    return { success: true, site, page }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function generateForgePageFromPrompt(
  pageId?: string,
  prompt?: string,
  vertical = "general"
) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const agencyId = auth.agencyId
    const userPrompt = (prompt || "").trim()
    if (!userPrompt) {
      return { success: false, error: "Please enter a prompt describing what to generate." }
    }

    let page: any = null

    if (pageId) {
      page = await db.forgePage.findUnique({
        where: { id: pageId },
        include: { site: true },
      })
    }

    if (!page || page.site.agencyId !== agencyId) {
      let site = await db.forgeSite.findFirst({
        where: { agencyId },
        include: { pages: true },
      })

      if (!site) {
        const agency = await db.agency.findUnique({
          where: { id: agencyId },
          select: { name: true },
        })
        const siteName = agency?.name || "My Site"
        site = await db.forgeSite.create({
          data: {
            agencyId,
            name: siteName,
            domain: `${siteName.toLowerCase().replace(/[^a-z0-9]/g, "-") || "site"}-${Date.now().toString().slice(-4)}.nexlin.site`,
            status: "draft",
          },
          include: { pages: true },
        })
      }

      if (!site.pages || site.pages.length === 0) {
        page = await db.forgePage.create({
          data: {
            siteId: site.id,
            slug: "home",
            componentTree: JSON.stringify([]),
            version: 1,
          },
          include: { site: true },
        })
      } else {
        page = await db.forgePage.findUnique({
          where: { id: site.pages[0].id },
          include: { site: true },
        })
      }
    }

    const layoutPrompt = `Generate landing page sections as strictly valid JSON matching this schema:
{
  "sections": [
    { "id": "hero-1", "type": "hero", "title": "...", "subtitle": "...", "ctaText": "...", "ctaTarget": "#lead", "background": "dark" },
    { "id": "showcase-2", "type": "inventory_showcase", "title": "...", "items": [{ "name": "...", "price": "...", "mileage": "...", "badge": "..." }] },
    { "id": "lead-3", "type": "lead_form", "title": "...", "subtitle": "...", "fields": [{ "name": "fullName", "label": "Full Name", "type": "text", "required": true }, { "name": "email", "label": "Email", "type": "email", "required": true }], "buttonText": "Submit" },
    { "id": "testimonials-4", "type": "testimonials", "title": "...", "reviews": [{ "name": "...", "comment": "...", "rating": 5 }] }
  ]
}
User request: ${userPrompt}
Return ONLY raw JSON.`

    const layoutRes = await generateForgeTask("layout_generation", {
      prompt: layoutPrompt,
      pageId: page.id,
      vertical,
    })

    if (!layoutRes.success || !layoutRes.output) {
      return {
        success: false,
        error: layoutRes.error || "AI page generation failed. Check your AI API key in Settings -> AI.",
      }
    }

    const rawSections = Array.isArray(layoutRes.output)
      ? layoutRes.output
      : Array.isArray(layoutRes.output?.sections)
        ? layoutRes.output.sections
        : null

    if (!rawSections || rawSections.length === 0) {
      return {
        success: false,
        error: "AI model did not return structured page sections. Please refine your prompt and try again.",
      }
    }

    const generatedSections = rawSections.map((sec: any, idx: number) => ({
      ...sec,
      id: sec.id || `section-${idx + 1}`,
      isStreamingNew: true,
    }))

    const seoRes = await generateForgeTask("seo_metadata", {
      prompt: `Generate JSON { "title": string, "description": string, "keywords": string[] } for "${page.site.name}" regarding: ${userPrompt}. Only return raw JSON.`,
      pageId: page.id,
    })

    const seoMeta =
      seoRes.success && seoRes.output && typeof seoRes.output === "object"
        ? seoRes.output
        : {
            title: page.site.name,
            description: userPrompt.slice(0, 155),
            keywords: [],
          }

    const updatedPage = await db.forgePage.update({
      where: { id: page.id },
      data: {
        componentTree: JSON.stringify(generatedSections),
        seoMeta: JSON.stringify(seoMeta),
        version: (page.version || 1) + 1,
      },
      include: { site: true },
    })

    revalidatePath("/forge")
    return { success: true, site: page.site, page: updatedPage, sections: generatedSections }
  } catch (error: any) {
    console.error("Forge Generation Error:", error)
    return { success: false, error: error.message || "Failed to generate page" }
  }
}

export async function updateForgeSectionPrompt(
  pageId: string,
  sectionId: string,
  editPrompt: string
) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const page = await db.forgePage.findUnique({
      where: { id: pageId },
      include: { site: true },
    })

    if (!page || page.site.agencyId !== auth.agencyId) {
      return { success: false, error: "Access denied" }
    }

    const sections: any[] = JSON.parse(page.componentTree || "[]")
    const targetIdx = sections.findIndex((s) => s.id === sectionId)
    if (targetIdx === -1) {
      return { success: false, error: "Section not found" }
    }

    const currentSection = sections[targetIdx]
    const editRes = await generateForgeTask("copywriting", {
      prompt: `Update the following JSON section according to this instruction: "${editPrompt}".\nPreserve the existing "id" and "type".\nCurrent section:\n${JSON.stringify(currentSection)}\nReturn ONLY valid JSON for the updated section object.`,
      pageId,
    })

    if (!editRes.success || !editRes.output || typeof editRes.output !== "object") {
      return {
        success: false,
        error: editRes.error || "AI section update failed. Check your AI API key in Settings -> AI.",
      }
    }

    sections[targetIdx] = {
      ...currentSection,
      ...editRes.output,
      id: currentSection.id,
      type: currentSection.type,
      isStreamingNew: true,
    }

    const updatedPage = await db.forgePage.update({
      where: { id: pageId },
      data: {
        componentTree: JSON.stringify(sections),
        version: page.version + 1,
      },
    })

    revalidatePath("/forge")
    return { success: true, page: updatedPage, sections }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
