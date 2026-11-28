"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { generateForgeTask } from "@/lib/forge/forge-gateway"

export async function runDesignCritique(pageId: string) {
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
      return { success: false, error: "Page not found" }
    }

    const res = await generateForgeTask("design_critique", {
      prompt: `Critique contrast, typography, hierarchy, spacing, and mobile responsiveness for these components:\n${(page.componentTree || "[]").slice(0, 6000)}\nReturn strictly valid JSON with keys: "overallScore" (number 0-100), "contrastStatus" (string), "spacingStatus" (string), "mobileResponsive" (boolean), "suggestions" (string[]).`,
      pageId,
    })

    if (!res.success || !res.output || typeof res.output !== "object") {
      return {
        success: false,
        error: res.error || "AI design critique unavailable. Configure an AI key in Settings -> AI.",
      }
    }

    const out = res.output as Record<string, any>
    if (typeof out.overallScore !== "number" || !Array.isArray(out.suggestions)) {
      return {
        success: false,
        error: "AI design critique returned an invalid report format.",
      }
    }

    return {
      success: true,
      critique: {
        overallScore: Math.min(100, Math.max(0, Math.round(out.overallScore))),
        contrastStatus: String(out.contrastStatus || "Reviewed"),
        spacingStatus: String(out.spacingStatus || "Reviewed"),
        mobileResponsive: Boolean(out.mobileResponsive ?? true),
        suggestions: out.suggestions.map(String),
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
