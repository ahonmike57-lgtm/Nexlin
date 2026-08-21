"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function issueCertificate(contactId: string, courseName: string, validityDays = 365) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + validityDays)

    const cert = await db.snapshot.create({
      data: {
        agencyId: auth.agencyId,
        name: `Certificate - ${courseName}`,
        version: "lms_certificate",
        description: JSON.stringify({
          contactId,
          courseName,
          issuedAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          status: "active",
          certificateId: "CERT-" + Math.random().toString(36).substring(2, 9).toUpperCase()
        })
      }
    })

    revalidatePath("/support")
    return { success: true, cert }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getExpiringCertificates(withinDays = 30) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const certs = await db.snapshot.findMany({
      where: { agencyId: auth.agencyId, version: "lms_certificate" }
    })

    const now = new Date()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + withinDays)

    const expiring = certs.filter(c => {
      if (!c.description) return false
      try {
        const data = JSON.parse(c.description)
        const exp = new Date(data.expiresAt)
        return exp > now && exp <= cutoff
      } catch {
        return false
      }
    })

    return { success: true, certificates: expiring }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
