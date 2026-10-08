"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { encryptConfig, decryptConfig } from "@/lib/encryption"
import { revalidatePath } from "next/cache"
import { verifyWhatsappCredentials } from "@/lib/messaging"

export async function getAgencyConnectedChannels() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return {
      success: false,
      data: {
        sms: { connected: false, label: "Not configured" },
        whatsapp: { connected: false, label: null },
        email: { connected: false, label: null }
      }
    }
  }

  // 1. Check Twilio phone number
  const ownedNumber = await db.phoneNumber.findFirst({
    where: { agencyId: auth.agencyId, status: "active" },
    orderBy: { createdAt: "asc" }
  })
  const defaultTwilio = process.env.TWILIO_PHONE_NUMBER
  const smsNumber = ownedNumber?.number || defaultTwilio || null

  // 2. Check Channel credentials
  const snapshot = await db.snapshot.findFirst({
    where: { agencyId: auth.agencyId, name: "channel_credentials" }
  })

  let creds: any = {}
  if (snapshot?.description) {
    try {
      creds = JSON.parse(decryptConfig(snapshot.description))
    } catch {}
  }

  const resendFrom = creds.emailAddress || process.env.RESEND_FROM_EMAIL || null

  return {
    success: true,
    data: {
      sms: {
        connected: !!smsNumber && !!process.env.TWILIO_ACCOUNT_SID,
        label: smsNumber || "Not configured"
      },
      whatsapp: {
        connected: !!creds.whatsappPhoneNumberId && !!creds.whatsappAccessToken,
        label: creds.whatsappDisplayNumber || (creds.whatsappPhoneNumberId ? `ID: ${creds.whatsappPhoneNumberId}` : null)
      },
      email: {
        connected: !!resendFrom && !!process.env.RESEND_API_KEY,
        label: resendFrom
      }
    }
  }
}

export async function getChannelCredentials() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const snapshot = await db.snapshot.findFirst({
      where: { agencyId: auth.agencyId, name: "channel_credentials" }
    })

    if (!snapshot?.description) {
      return {
        success: true,
        data: {
          whatsappPhoneNumberId: "",
          whatsappWabaId: "",
          whatsappAccessTokenMasked: "",
          whatsappDisplayNumber: "",
          emailAddress: "",
          smtpHost: "smtp.sendgrid.net",
          smtpPort: "587",
          smtpUser: "",
          isWhatsappConnected: false,
          isEmailConnected: false
        }
      }
    }

    let decrypted: any = {}
    try {
      decrypted = JSON.parse(decryptConfig(snapshot.description))
    } catch {
      decrypted = {}
    }

    return {
      success: true,
      data: {
        ...decrypted,
        whatsappAccessTokenMasked: decrypted.whatsappAccessToken ? "••••••••" + decrypted.whatsappAccessToken.slice(-4) : "",
        isWhatsappConnected: !!decrypted.whatsappPhoneNumberId && !!decrypted.whatsappAccessToken,
        isEmailConnected: !!decrypted.emailAddress
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function saveChannelCredentials(credentials: {
  whatsappPhoneNumberId?: string
  whatsappWabaId?: string
  whatsappAccessToken?: string
  emailAddress?: string
  smtpHost?: string
  smtpPort?: string
  smtpUser?: string
  smtpPassword?: string
}) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const existing = await db.snapshot.findFirst({
      where: { agencyId: auth.agencyId, name: "channel_credentials" }
    })

    let current: any = {}
    if (existing?.description) {
      try {
        current = JSON.parse(decryptConfig(existing.description))
      } catch {}
    }

    let verifiedDisplayNumber = current.whatsappDisplayNumber || ""
    if (credentials.whatsappPhoneNumberId && credentials.whatsappAccessToken) {
      const verification = await verifyWhatsappCredentials(
        credentials.whatsappPhoneNumberId,
        credentials.whatsappAccessToken
      )
      if (!verification.ok) {
        return { success: false, error: verification.error }
      }
      if (verification.displayNumber) {
        verifiedDisplayNumber = verification.displayNumber
      }
    }

    const updated = {
      ...current,
      whatsappPhoneNumberId: credentials.whatsappPhoneNumberId !== undefined ? credentials.whatsappPhoneNumberId : (current.whatsappPhoneNumberId || ""),
      whatsappWabaId: credentials.whatsappWabaId !== undefined ? credentials.whatsappWabaId : (current.whatsappWabaId || ""),
      whatsappAccessToken: credentials.whatsappAccessToken !== undefined ? credentials.whatsappAccessToken : (current.whatsappAccessToken || ""),
      whatsappDisplayNumber: verifiedDisplayNumber,
      emailAddress: credentials.emailAddress !== undefined ? credentials.emailAddress : (current.emailAddress || ""),
      smtpHost: credentials.smtpHost || current.smtpHost || "smtp.sendgrid.net",
      smtpPort: credentials.smtpPort || current.smtpPort || "587",
      smtpUser: credentials.smtpUser || current.smtpUser || "",
      smtpPassword: credentials.smtpPassword || current.smtpPassword || ""
    }

    const encryptedPayload = encryptConfig(JSON.stringify(updated))

    if (existing) {
      await db.snapshot.update({
        where: { id: existing.id },
        data: { description: encryptedPayload }
      })
    } else {
      await db.snapshot.create({
        data: {
          agencyId: auth.agencyId,
          name: "channel_credentials",
          version: "v1",
          description: encryptedPayload
        }
      })
    }

    revalidatePath("/chat")
    revalidatePath("/settings/integrations")
    return { success: true, message: "Channel credentials saved & encrypted successfully!" }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
