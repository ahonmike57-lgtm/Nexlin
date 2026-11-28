"use server"

import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { db as rawDb } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { withAgency } from "@/lib/tenant"
import { triggerFormSubmissionWorkflowInternal } from "@/lib/workflow-engine"
import { generateAiReply } from "./ai"
import { getActiveSubAccountId } from "./subaccounts"

const ALLOWED_STATUSES = new Set(["draft", "published", "archived"])

export type BuilderTheme = "clean-light" | "modern-dark" | "bold-agency" | "minimal"

export interface StepHistoryEntry {
  savedAt: string
  label: string
  content: string
}

export interface StepConfigMeta {
  seoTitle?: string
  seoDescription?: string
  history?: StepHistoryEntry[]
}

function parseStepConfig(raw: string | null | undefined): StepConfigMeta {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object") {
      return parsed as StepConfigMeta
    }
  } catch {}
  return {}
}

function normalizeSlugPath(rawPath: string): string {
  const cleaned = rawPath
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/[^a-z0-9-/]/g, "-")
    .replace(/-+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "")
  if (!cleaned || cleaned === "home") return "/"
  return `/${cleaned}`
}

function makeSubdomain(name: string): string {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "site"
  const suffix = crypto.randomBytes(3).toString("hex")
  return `${slug}-${suffix}`
}

function cleanGeneratedHtml(raw: string, titleFallback = "AI Website"): string {
  let code = raw
    .replace(/```html\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim()

  if (!code.toLowerCase().startsWith("<!doctype")) {
    code = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titleFallback.replace(/[<>]/g, "")}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-white text-slate-900">
${code}
</body>
</html>`
  }
  return code
}

const THEME_GUIDANCE: Record<BuilderTheme, string> = {
  "clean-light":
    "Clean Light SaaS/Corporate palette: bright #ffffff / #f8fafc backgrounds, crisp slate borders, deep indigo/blue #2563eb primary accents, dark slate #0f172a typography.",
  "modern-dark":
    "Modern Dark Mode palette: deep #0b1120 / #0f172a backgrounds, subtle slate-800 borders, luminous #6366f1 / #38bdf8 accents, high-contrast #f8fafc typography.",
  "bold-agency":
    "Bold Agency Editorial palette: strong high-contrast black #09090b & warm white #fafaf9 blocks, vibrant amber #f59e0b or emerald #10b981 CTA buttons, generous whitespace.",
  minimal:
    "Minimal Typographic palette: neutral #ffffff background, hairline #e5e7eb dividers, monochrome #111827 buttons and editorial hierarchy.",
}

export const getFunnels = withAgency(async ({ db }) => {
  const subAgencyId = await getActiveSubAccountId()
  const whereClause: any = {}
  if (subAgencyId) {
    whereClause.subAgencyId = subAgencyId
  }

  return db.funnel.findMany({
    where: whereClause,
    include: {
      steps: { orderBy: { order: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  })
})

export const createFunnel = withAgency(
  async (
    { db, agencyId },
    name: string,
    options?: { initialHtml?: string; status?: "draft" | "published" }
  ) => {
    const subAgencyId = await getActiveSubAccountId()
    const cleanName = (name || "New Website").trim() || "New Website"
    const requestedStatus = options?.status && ALLOWED_STATUSES.has(options.status)
      ? options.status
      : "draft"

    const funnel = await db.funnel.create({
      data: {
        agencyId,
        subAgencyId,
        name: cleanName,
        subdomain: makeSubdomain(cleanName),
        status: requestedStatus,
        steps: {
          create: [
            {
              name: "Home",
              path: "/",
              order: 0,
              content: options?.initialHtml || "",
              config: JSON.stringify({ seoTitle: cleanName }),
            },
          ],
        },
      },
      include: {
        steps: { orderBy: { order: "asc" } },
      },
    })

    revalidatePath("/funnels")
    revalidatePath("/websites")
    revalidatePath("/forge")
    return funnel
  }
)

export const getFunnel = withAgency(
  async ({ db }, funnelId: string) => {
    const funnel = await db.funnel.findFirst({
      where: { id: funnelId },
      include: { steps: { orderBy: { order: "asc" } } },
    })
    if (!funnel) throw new Error("Funnel not found")
    return funnel
  }
)

export const updateFunnelMetadata = withAgency(
  async (
    { db },
    funnelId: string,
    data: { name?: string; status?: "draft" | "published" | "archived"; subdomain?: string }
  ) => {
    const owned = await db.funnel.findFirst({
      where: { id: funnelId },
      select: { id: true, subdomain: true },
    })
    if (!owned) throw new Error("Site not found")

    const updateData: Record<string, any> = {}
    if (data.name !== undefined) {
      const cleanName = data.name.trim()
      if (!cleanName) throw new Error("Site name cannot be empty")
      updateData.name = cleanName
    }
    if (data.status !== undefined) {
      const normalizedStatus = data.status.toLowerCase()
      if (!ALLOWED_STATUSES.has(normalizedStatus)) {
        throw new Error("Invalid status. Must be draft, published, or archived")
      }
      updateData.status = normalizedStatus
    }
    if (data.subdomain !== undefined) {
      const cleanSubdomain = data.subdomain
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50)
      if (!cleanSubdomain || cleanSubdomain.length < 2) {
        throw new Error("Subdomain must be at least 2 characters")
      }
      updateData.subdomain = cleanSubdomain
    }

    try {
      await db.funnel.updateMany({
        where: { id: owned.id },
        data: updateData,
      })
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new Error("That subdomain is already in use")
      }
      throw err
    }

    const updated = await db.funnel.findFirst({
      where: { id: owned.id },
      include: { steps: { orderBy: { order: "asc" } } },
    })

    revalidatePath("/funnels")
    revalidatePath("/websites")
    revalidatePath("/forge")
    revalidatePath(`/funnels/${owned.id}`)
    return updated
  }
)

export const deleteFunnel = withAgency(async ({ db }, funnelId: string) => {
  const deleted = await db.funnel.deleteMany({
    where: { id: funnelId },
  })
  if (deleted.count === 0) {
    throw new Error("Site not found")
  }

  revalidatePath("/funnels")
  revalidatePath("/websites")
  revalidatePath("/forge")
  return { id: funnelId }
})

export const duplicateFunnel = withAgency(async ({ db, agencyId }, funnelId: string) => {
  const original = await db.funnel.findFirst({
    where: { id: funnelId },
    include: { steps: { orderBy: { order: "asc" } } },
  })
  if (!original) {
    throw new Error("Site not found")
  }

  const copyName = `${original.name} (Copy)`
  const cloned = await db.funnel.create({
    data: {
      agencyId,
      subAgencyId: original.subAgencyId,
      name: copyName,
      subdomain: makeSubdomain(copyName),
      status: "draft",
      steps: {
        create: original.steps.map((s, idx) => ({
          name: s.name,
          path: s.path,
          order: idx,
          content: s.content,
          config: s.config,
        })),
      },
    },
    include: { steps: { orderBy: { order: "asc" } } },
  })

  revalidatePath("/funnels")
  revalidatePath("/websites")
  revalidatePath("/forge")
  return cloned
})

export const addFunnelStep = withAgency(
  async ({ db }, funnelId: string, data: { name: string; path: string; content?: string }) => {
    const funnel = await db.funnel.findFirst({
      where: { id: funnelId },
      include: { steps: { orderBy: { order: "asc" } } },
    })
    if (!funnel) {
      throw new Error("Site not found")
    }

    const cleanName = (data.name || "").trim()
    if (!cleanName) {
      throw new Error("Page name is required")
    }

    const normalizedPath = normalizeSlugPath(data.path || cleanName)
    if (funnel.steps.some((s) => s.path === normalizedPath)) {
      throw new Error(`A page with path "${normalizedPath}" already exists on this site`)
    }

    const step = await rawDb.funnelStep.create({
      data: {
        funnelId: funnel.id,
        name: cleanName,
        path: normalizedPath,
        order: funnel.steps.length,
        content: data.content || "",
        config: JSON.stringify({ seoTitle: `${cleanName} | ${funnel.name}` }),
      },
    })

    revalidatePath(`/funnels/${funnel.id}`)
    revalidatePath("/websites")
    revalidatePath("/forge")
    return step
  }
)

export const deleteFunnelStep = withAgency(
  async ({ db }, funnelId: string, stepId: string) => {
    const funnel = await db.funnel.findFirst({
      where: { id: funnelId },
      include: { steps: true },
    })
    if (!funnel) {
      throw new Error("Site not found")
    }
    if (funnel.steps.length <= 1) {
      throw new Error("Cannot delete the only page of a site")
    }

    const deleted = await rawDb.funnelStep.deleteMany({
      where: { id: stepId, funnelId: funnel.id },
    })
    if (deleted.count === 0) {
      throw new Error("Page not found")
    }

    revalidatePath(`/funnels/${funnel.id}`)
    revalidatePath("/websites")
    revalidatePath("/forge")
    return { id: stepId }
  }
)

async function persistStepUpdate(
  agencyId: string,
  stepId: string,
  data: {
    name?: string
    content?: string
    seoTitle?: string
    seoDescription?: string
    historyLabel?: string
    saveHistory?: boolean
  }
) {
  const ownedStep = await rawDb.funnelStep.findFirst({
    where: { id: stepId, funnel: { agencyId } },
    include: { funnel: { select: { id: true, subdomain: true } } },
  })

  if (!ownedStep) {
    throw new Error("Funnel step not found")
  }

  const meta = parseStepConfig(ownedStep.config)
  if (data.seoTitle !== undefined) meta.seoTitle = data.seoTitle.trim()
  if (data.seoDescription !== undefined) meta.seoDescription = data.seoDescription.trim()

  if (
    data.saveHistory &&
    typeof data.content === "string" &&
    ownedStep.content &&
    ownedStep.content.trim() !== "" &&
    ownedStep.content !== data.content
  ) {
    const prevHistory = Array.isArray(meta.history) ? meta.history : []
    meta.history = [
      ...prevHistory,
      {
        savedAt: new Date().toISOString(),
        label: data.historyLabel || "Manual Save",
        content: ownedStep.content,
      },
    ].slice(-10)
  }

  const updated = await rawDb.funnelStep.update({
    where: { id: ownedStep.id },
    data: {
      ...(data.name !== undefined && data.name.trim() ? { name: data.name.trim() } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      config: JSON.stringify(meta),
    },
  })

  revalidatePath(`/funnels/${ownedStep.funnel.id}`)
  revalidatePath("/forge")
  if (ownedStep.funnel.subdomain) {
    revalidatePath(`/f/${ownedStep.funnel.subdomain}`)
  }

  return updated
}

export const updateFunnelStep = withAgency(
  async (
    { agencyId },
    stepId: string,
    data: {
      name?: string
      content?: string
      seoTitle?: string
      seoDescription?: string
      historyLabel?: string
      saveHistory?: boolean
    }
  ) => {
    return persistStepUpdate(agencyId, stepId, data)
  }
)

export const updateFunnelStepContent = withAgency(
  async ({ agencyId }, stepId: string, content: string) => {
    const updated = await persistStepUpdate(agencyId, stepId, {
      content,
      saveHistory: true,
      historyLabel: "Saved Version",
    })
    return { id: updated.id, updated: true }
  }
)

export const generateWebsitePageWithAi = withAgency(
  async (
    { agencyId },
    params: {
      stepId?: string
      prompt: string
      currentHtml?: string
      mode: "generate" | "edit"
      theme?: BuilderTheme
      siteName?: string
      pageName?: string
      siblingPages?: Array<{ name: string; path: string }>
    }
  ) => {
    const cleanPrompt = (params.prompt || "").trim()
    if (!cleanPrompt) {
      throw new Error("Please enter a prompt describing the page or change you want.")
    }

    const themeKey = params.theme || "clean-light"
    const themeDesc = THEME_GUIDANCE[themeKey] || THEME_GUIDANCE["clean-light"]
    const navContext =
      params.siblingPages && params.siblingPages.length > 1
        ? `Site navigation links to include in header: ${params.siblingPages
            .map((p) => `${p.name} (href="${p.path}")`)
            .join(", ")}.`
        : ""

    let aiPrompt = ""
    if (params.mode === "edit" && params.currentHtml?.trim()) {
      aiPrompt = `You are a senior web designer & frontend developer refining an existing HTML landing page.

Requested change:
"${cleanPrompt}"

Site: ${params.siteName || "Business Website"} | Page: ${params.pageName || "Home"}
Visual Theme preference: ${themeDesc}
${navContext}

EXISTING HTML TO UPDATE:
${params.currentHtml.slice(0, 18000)}

STRICT RULES:
1. Apply the requested edits cleanly while preserving the rest of the working layout unless the request replaces everything.
2. Return ONLY the complete raw HTML document starting with <!DOCTYPE html>.
3. Keep <script src="https://cdn.tailwindcss.com"></script> in <head>.
4. If the page has a lead capture form, use clean standard field names: name="name", name="email", name="phone" inside a <form>.
5. NO markdown code fences, NO explanations.`
    } else {
      aiPrompt = `You are a senior conversion-focused web designer building a responsive website page.

Business / Page Request:
"${cleanPrompt}"

Site Name: ${params.siteName || "Business Website"}
Page Name: ${params.pageName || "Home"}
Visual Theme: ${themeDesc}
${navContext}

STRICT RULES:
1. Return ONLY raw HTML5 starting with <!DOCTYPE html> — NO markdown fences, NO explanations.
2. Include <script src="https://cdn.tailwindcss.com"></script> and mobile viewport meta in <head>.
3. Build complete, realistic sections (header/nav, hero, value props/features, social proof/FAQ, CTA, footer) tailored to the prompt — never insert placeholder lorem ipsum or fake auto dealership branding unless asked.
4. For any lead capture <form>, include clear labeled inputs using name="name", name="email", and name="phone" plus a styled submit button.
5. Ensure strong visual contrast, responsive typography, and clean Tailwind utility classes.`
    }

    const aiRes = await generateAiReply("landing_page", aiPrompt)
    if (!aiRes.success || !aiRes.data) {
      throw new Error(
        aiRes.error || "AI generation unavailable. Configure your AI API key in Settings -> AI."
      )
    }

    const html = cleanGeneratedHtml(aiRes.data, params.pageName || params.siteName || "AI Website")

    let updatedStep = null
    if (params.stepId) {
      updatedStep = await persistStepUpdate(agencyId, params.stepId, {
        content: html,
        saveHistory: true,
        historyLabel: params.mode === "edit" ? `AI Edit: ${cleanPrompt.slice(0, 40)}` : `AI Generate: ${cleanPrompt.slice(0, 40)}`,
      })
    }

    return {
      html,
      step: updatedStep,
    }
  }
)

export async function getLiveFunnelStep(subdomain: string, slug: string) {
  try {
    const pathToMatch = normalizeSlugPath(slug || "home")

    const funnel = await rawDb.funnel.findUnique({
      where: { subdomain },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
      },
    })

    if (!funnel) {
      return { success: false, error: "Not found" }
    }

    const status = (funnel.status || "").toLowerCase()
    if (status !== "published" && status !== "active") {
      return { success: false, error: "Not found" }
    }

    const matchedStep =
      funnel.steps.find((s) => s.path === pathToMatch) ||
      (pathToMatch === "/" ? funnel.steps[0] : null)

    if (!matchedStep) {
      return { success: false, error: "Not found" }
    }

    const pages = funnel.steps.map((s) => ({
      id: s.id,
      name: s.name,
      path: s.path,
    }))

    return {
      success: true,
      data: {
        funnel,
        step: matchedStep,
        pages,
      },
    }
  } catch (error) {
    console.error("Failed to fetch live funnel:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function submitLiveFunnelForm(subdomain: string, formData: any) {
  try {
    const rl = checkRateLimit(`funnel-submit:${subdomain}`, {
      maxRequests: 20,
      windowSeconds: 60,
    })
    if (!rl.allowed) {
      return { success: false, error: "Too many submissions. Please try again shortly." }
    }

    const funnel = await rawDb.funnel.findUnique({
      where: { subdomain },
      select: { id: true, agencyId: true, subAgencyId: true, status: true },
    })

    if (!funnel) return { success: false, error: "Funnel not found" }

    const status = (funnel.status || "").toLowerCase()
    if (status === "archived" || status === "disabled") {
      return { success: false, error: "This funnel is no longer accepting submissions" }
    }

    const rawEmail =
      typeof formData?.email === "string"
        ? formData.email.trim().toLowerCase()
        : typeof formData?.Email === "string"
          ? formData.Email.trim().toLowerCase()
          : ""
    const rawPhone =
      typeof formData?.phone === "string"
        ? formData.phone.trim()
        : typeof formData?.Phone === "string"
          ? formData.Phone.trim()
          : ""
    const email = rawEmail || null
    const phone = rawPhone || null

    if (!email && !phone) {
      return { success: false, error: "Please provide an email address or phone number." }
    }

    const fullName =
      typeof formData?.fullName === "string"
        ? formData.fullName.trim()
        : typeof formData?.name === "string"
          ? formData.name.trim()
          : typeof formData?.Name === "string"
            ? formData.Name.trim()
            : ""
    const [firstName, ...rest] = fullName ? fullName.split(/\s+/) : ["Website", "Lead"]
    const lastName = rest.join(" ") || null

    let contact = await rawDb.contact.findFirst({
      where: {
        agencyId: funnel.agencyId,
        deletedAt: null,
        ...(email ? { email } : { phone }),
      },
    })

    if (!contact) {
      contact = await rawDb.contact.create({
        data: {
          agencyId: funnel.agencyId,
          subAgencyId: funnel.subAgencyId,
          firstName: firstName || "Website",
          lastName,
          email,
          phone,
          leadScore: 30,
          tags: "funnel_submission",
        },
      })
    } else {
      contact = await rawDb.contact.update({
        where: { id: contact.id },
        data: {
          ...(phone && !contact.phone ? { phone } : {}),
          ...(email && !contact.email ? { email } : {}),
          leadScore: (contact.leadScore || 0) + 15,
        },
      })
    }

    await triggerFormSubmissionWorkflowInternal(
      funnel.agencyId,
      funnel.id,
      contact.id,
      formData,
      funnel.subAgencyId
    ).catch(() => {})

    return {
      success: true,
      data: contact,
      message: "Thank you! Your submission has been received.",
    }
  } catch (error) {
    console.error("Form submission failed:", error)
    return { success: false, error: "Submission failed" }
  }
}

export const publishVibecodeToFunnel = withAgency(
  async (
    { db, agencyId },
    data: { name: string; htmlContent: string; existingFunnelId?: string }
  ) => {
    const subAgencyId = await getActiveSubAccountId()

    if (data.existingFunnelId) {
      const existing = await db.funnel.findFirst({
        where: { id: data.existingFunnelId },
        include: { steps: { orderBy: { order: "asc" } } },
      })

      if (!existing) {
        throw new Error("Site not found")
      }

      if (existing.steps.length > 0) {
        await persistStepUpdate(agencyId, existing.steps[0].id, {
          content: data.htmlContent,
          saveHistory: true,
          historyLabel: "Published from Vibecode Lab",
        })
      } else {
        await rawDb.funnelStep.create({
          data: {
            funnelId: existing.id,
            name: "Home",
            path: "/",
            order: 0,
            content: data.htmlContent,
          },
        })
      }

      await db.funnel.updateMany({
        where: { id: existing.id },
        data: {
          status: "published",
          ...(data.name.trim() ? { name: data.name.trim() } : {}),
        },
      })

      revalidatePath("/funnels")
      revalidatePath("/websites")
      revalidatePath("/forge")
      revalidatePath("/forge/vibecode")
      revalidatePath(`/funnels/${existing.id}`)
      if (existing.subdomain) {
        revalidatePath(`/f/${existing.subdomain}`)
      }

      return {
        funnelId: existing.id,
        subdomain: existing.subdomain,
        liveUrl: `/f/${existing.subdomain}`,
      }
    }

    const cleanName = data.name.trim() || "AI Landing Page"
    const cleanSubdomain = makeSubdomain(cleanName)

    const funnel = await db.funnel.create({
      data: {
        agencyId,
        subAgencyId,
        name: cleanName,
        subdomain: cleanSubdomain,
        status: "published",
        steps: {
          create: [
            {
              name: "Home",
              path: "/",
              order: 0,
              content: data.htmlContent,
              config: JSON.stringify({ seoTitle: cleanName }),
            },
          ],
        },
      },
    })

    revalidatePath("/funnels")
    revalidatePath("/websites")
    revalidatePath("/forge")
    revalidatePath("/forge/vibecode")
    return {
      funnelId: funnel.id,
      subdomain: funnel.subdomain,
      liveUrl: `/f/${funnel.subdomain}`,
    }
  }
)
