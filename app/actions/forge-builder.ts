"use server"

import { db } from "@/lib/db"
import { getOrCreateAgency } from "./agency"
import { generateForgeTask } from "@/lib/forge/forge-gateway"
import { revalidatePath } from "next/cache"

export async function createForgeSite(name: string, domain?: string) {
  try {
    const agencyId = await getOrCreateAgency()
    const cleanDomain = domain 
      ? domain.trim().toLowerCase() 
      : `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}.nexlin.site`

    const site = await db.forgeSite.create({
      data: {
        agencyId,
        name: name.trim(),
        domain: cleanDomain,
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

export async function generateForgePageFromPrompt(pageId?: string, prompt?: string, vertical = "dealership") {
  try {
    const agencyId = await getOrCreateAgency()
    const userPrompt = prompt || "Build a high-converting auto dealership landing page with inventory showcase, credit pre-qualification form, and testimonials."

    let page: any = null

    if (pageId) {
      page = await db.forgePage.findUnique({
        where: { id: pageId },
        include: { site: true }
      })
    }

    // Auto-provision site & page if not found or pageId missing
    if (!page || page.site.agencyId !== agencyId) {
      let site = await db.forgeSite.findFirst({
        where: { agencyId },
        include: { pages: true }
      })

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

      if (!site.pages || site.pages.length === 0) {
        page = await db.forgePage.create({
          data: {
            siteId: site.id,
            slug: "home",
            componentTree: JSON.stringify([]),
            version: 1
          },
          include: { site: true }
        })
      } else {
        page = await db.forgePage.findUnique({
          where: { id: site.pages[0].id },
          include: { site: true }
        })
      }
    }

    // Step 1: Layout Task
    await generateForgeTask("layout_generation", { prompt: userPrompt, pageId: page.id, vertical })

    // Build structured sections customized by prompt keywords
    const isServicePrompt = userPrompt.toLowerCase().includes("service") || userPrompt.toLowerCase().includes("repair")
    const isFinancingPrompt = userPrompt.toLowerCase().includes("financ") || userPrompt.toLowerCase().includes("pre-qual")

    const generatedSections = [
      {
        id: "hero-1",
        type: "hero",
        title: isServicePrompt 
          ? "Express Vehicle Service & Repair Center" 
          : isFinancingPrompt 
          ? "Instant $0 Down Auto Financing Pre-Approval" 
          : "Drive Home Your Dream Vehicle Today",
        subtitle: isServicePrompt
          ? "Certified mechanics, genuine OEM parts, and same-day express service appointments."
          : "Premium pre-owned inventory with guaranteed fast credit approval in 60 seconds.",
        ctaText: isServicePrompt ? "Schedule Service Appointment" : "Get Approved in 2 Minutes",
        ctaTarget: "#prequal",
        background: "dark",
        isStreamingNew: true
      },
      {
        id: "inventory-2",
        type: "inventory_showcase",
        title: isServicePrompt ? "Popular Express Service Packages" : "Featured Dealership Inventory",
        items: isServicePrompt ? [
          { name: "Full Synthetic Oil & Filter Change", price: "$69.95", mileage: "Includes 30-Pt Check", badge: "Express" },
          { name: "Front & Rear Brake Replacement", price: "$249.00", mileage: "OEM Ceramic Pads", badge: "Popular" },
          { name: "Complete Executive Detailing", price: "$149.50", mileage: "Interior & Exterior", badge: "Special" }
        ] : [
          { name: "2023 Ford F-150 Lariat 4x4", price: "$42,990", mileage: "18,400 mi", badge: "Hot Deal" },
          { name: "2022 Chevrolet Tahoe LT", price: "$51,500", mileage: "24,100 mi", badge: "Verified" },
          { name: "2021 Toyota Camry SE", price: "$23,800", mileage: "31,000 mi", badge: "Low Miles" }
        ],
        isStreamingNew: true
      },
      {
        id: "prequal-3",
        type: "lead_form",
        title: isServicePrompt ? "Book Service Appointment Online" : "Instant Credit Pre-Qualification",
        subtitle: "No impact on your credit score. Fast 60-second decision.",
        fields: [
          { name: "fullName", label: "Full Name", type: "text", required: true },
          { name: "email", label: "Email Address", type: "email", required: true },
          { name: "phone", label: "Phone Number", type: "tel", required: true },
          { name: "monthlyIncome", label: isServicePrompt ? "Select Service Type" : "Estimated Monthly Income", type: "select", options: isServicePrompt ? ["Oil Change", "Brake Repair", "Full Detail"] : ["$2,000 - $4,000", "$4,000 - $7,000", "$7,000+"] }
        ],
        buttonText: isServicePrompt ? "Confirm Service Booking" : "Submit Pre-Qual Application",
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
    await generateForgeTask("seo_metadata", { prompt: userPrompt, pageId: page.id })
    const seoMeta = {
      title: `${page.site.name} | Auto Dealership & Financing`,
      description: `Official site for ${page.site.name}. Browse quality inventory and apply for financing online.`,
      keywords: ["used cars", "auto financing", "trade-in value"]
    }

    // Save updated component tree and bump version checkpoint
    const updatedPage = await db.forgePage.update({
      where: { id: page.id },
      data: {
        componentTree: JSON.stringify(generatedSections),
        seoMeta: JSON.stringify(seoMeta),
        version: (page.version || 1) + 1
      },
      include: { site: true }
    })

    revalidatePath("/forge")
    return { success: true, site: page.site, page: updatedPage, sections: generatedSections }
  } catch (error: any) {
    console.error("Forge Generation Error:", error)
    return { success: false, error: error.message || "Failed to generate page" }
  }
}

export async function updateForgeSectionPrompt(pageId: string, sectionId: string, editPrompt: string) {
  try {
    const agencyId = await getOrCreateAgency()
    const page = await db.forgePage.findUnique({
      where: { id: pageId },
      include: { site: true }
    })

    if (!page || page.site.agencyId !== agencyId) {
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
