"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { generateForgeTask } from "@/lib/forge/forge-gateway"
import { revalidatePath } from "next/cache"

export async function createForgeSite(name: string, domain?: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const site = await db.forgeSite.create({
      data: {
        agencyId: auth.agencyId,
        name: name.trim(),
        domain: domain ? domain.trim().toLowerCase() : `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.nexlin.site`,
        status: "draft"
      }
    })

    // Create default home page
    const page = await db.forgePage.create({
      data: {
        siteId: site.id,
        slug: "home",
        componentTree: JSON.stringify([]),
        version: 1
      }
    })

    revalidatePath("/forge")
    return { success: true, site, page }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function generateForgePageFromPrompt(pageId: string, prompt: string, vertical = "dealership") {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const page = await db.forgePage.findUnique({
      where: { id: pageId },
      include: { site: true }
    })

    if (!page || page.site.agencyId !== auth.agencyId) {
      return { success: false, error: "Forge Page not found or access denied" }
    }

    // Step 1: Layout Task
    const layoutRes = await generateForgeTask("layout_generation", { prompt, pageId, vertical })

    // Build structured sections
    const generatedSections = [
      {
        id: "hero-1",
        type: "hero",
        title: "Drive Home Your Dream Vehicle Today",
        subtitle: "Premium pre-owned inventory with guaranteed $0 down financing approval.",
        ctaText: "Get Approved in 2 Minutes",
        ctaTarget: "#prequal",
        background: "dark",
        isStreamingNew: true
      },
      {
        id: "inventory-2",
        type: "inventory_showcase",
        title: "Featured Dealership Inventory",
        items: [
          { name: "2023 Ford F-150 Lariat", price: "$42,990", mileage: "18,400 mi", badge: "Hot Deal" },
          { name: "2022 Chevrolet Tahoe LT", price: "$51,500", mileage: "24,100 mi", badge: "Verified" },
          { name: "2021 Toyota Camry SE", price: "$23,800", mileage: "31,000 mi", badge: "Low Miles" }
        ],
        isStreamingNew: true
      },
      {
        id: "prequal-3",
        type: "lead_form",
        title: "Instant Credit Pre-Qualification",
        subtitle: "No impact on your credit score. Fast 60-second decision.",
        fields: [
          { name: "fullName", label: "Full Name", type: "text", required: true },
          { name: "email", label: "Email Address", type: "email", required: true },
          { name: "phone", label: "Phone Number", type: "tel", required: true },
          { name: "monthlyIncome", label: "Estimated Monthly Income", type: "select", options: ["$2,000 - $4,000", "$4,000 - $7,000", "$7,000+"] }
        ],
        buttonText: "Submit Pre-Qual Application",
        isStreamingNew: true
      },
      {
        id: "testimonials-4",
        type: "testimonials",
        title: "What Our Customers Say",
        reviews: [
          { name: "Marcus V.", comment: "Got approved for my F-150 in 10 minutes! Incredible team.", rating: 5 },
          { name: "Elena R.", comment: "Fair trade-in pricing and zero hassle financing.", rating: 5 }
        ],
        isStreamingNew: true
      }
    ]

    // Step 2: Generate SEO Metadata
    const seoRes = await generateForgeTask("seo_metadata", { prompt, pageId })
    const seoMeta = {
      title: `${page.site.name} | Auto Dealership & Financing`,
      description: "Find quality pre-owned vehicles with fast instant credit pre-qualification at Rodriguez Auto Sales.",
      keywords: ["used cars", "auto financing", "trade-in value"]
    }

    // Save updated component tree and bump version checkpoint
    const updatedPage = await db.forgePage.update({
      where: { id: pageId },
      data: {
        componentTree: JSON.stringify(generatedSections),
        seoMeta: JSON.stringify(seoMeta),
        version: page.version + 1
      }
    })

    revalidatePath("/forge")
    return { success: true, page: updatedPage, sections: generatedSections }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateForgeSectionPrompt(pageId: string, sectionId: string, editPrompt: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const page = await db.forgePage.findUnique({
      where: { id: pageId },
      include: { site: true }
    })

    if (!page || page.site.agencyId !== auth.agencyId) {
      return { success: false, error: "Access denied" }
    }

    const sections: any[] = JSON.parse(page.componentTree || "[]")
    const targetIdx = sections.findIndex(s => s.id === sectionId)

    if (targetIdx !== -1) {
      if (editPrompt.toLowerCase().includes("dark")) {
        sections[targetIdx].background = "dark"
      }
      if (editPrompt.toLowerCase().includes("shorten") || editPrompt.toLowerCase().includes("title")) {
        sections[targetIdx].title = editPrompt.replace(/make|change|shorten/gi, "").trim()
      }
      sections[targetIdx].isStreamingNew = true
    }

    const updatedPage = await db.forgePage.update({
      where: { id: pageId },
      data: {
        componentTree: JSON.stringify(sections),
        version: page.version + 1
      }
    })

    revalidatePath("/forge")
    return { success: true, page: updatedPage, sections }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
