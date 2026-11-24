"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function updateFunnelDomain(funnelId: string, customDomain: string) {
  const auth = await requireTenantAuth("admin")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const cleanDomain = customDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")
    if (!cleanDomain) {
      return { success: false, error: "Invalid domain string" }
    }

    const ownedFunnel = await db.funnel.findFirst({
      where: { id: funnelId, agencyId: auth.agencyId },
      select: { id: true }
    })

    if (!ownedFunnel) {
      return { success: false, error: "Funnel not found in your agency" }
    }

    const updatedFunnel = await db.funnel.update({
      where: { id: ownedFunnel.id },
      data: { customDomain: cleanDomain }
    })

    revalidatePath("/settings/domains")
    revalidatePath("/funnels")
    return { success: true, data: updatedFunnel }
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { success: false, error: "This custom domain is already connected to another funnel." }
    }
    console.error("Failed to update domain:", error)
    return { success: false, error: "Failed to update domain" }
  }
}

export async function checkCustomDomainDns(domain: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")
    if (!cleanDomain) return { success: false, error: "Invalid domain string" }

    // DNS lookup verification via Google DNS-over-HTTPS
    const expectedCname = "cname.vercel-dns.com"
    const expectedA = "76.76.21.21"

    let isConfigured = false
    let recordType = "CNAME"
    let target = expectedCname

    if (cleanDomain.split(".").length === 2) {
      recordType = "A"
      target = expectedA
    }

    // Perform DNS query check
    try {
      const dnsRes = await fetch(`https://dns.google/resolve?name=${cleanDomain}&type=${recordType}`)
      const dnsData = await dnsRes.json()

      if (dnsData.Answer && dnsData.Answer.length > 0) {
        isConfigured = dnsData.Answer.some((ans: any) => ans.data.includes(target) || ans.data.includes("vercel"))
      }
    } catch {
      isConfigured = false
    }

    return {
      success: true,
      domain: cleanDomain,
      status: isConfigured ? "configured" : "pending_dns",
      requiredRecord: {
        type: recordType,
        name: cleanDomain.includes("www") ? "www" : "@",
        value: target
      },
      verifiedAt: new Date().toISOString()
    }
  } catch (error: any) {
    console.error("Check DNS error:", error)
    return { success: false, error: "Failed to check DNS status" }
  }
}