"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { encryptConfig, decryptConfig } from "@/lib/encryption"
import { revalidatePath } from "next/cache"

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
          emailAddress: "",
          smtpHost: "smtp.sendgrid.net",
          smtpPort: "587",
          smtpUser: "",
          isWhatsappConnected: false,
          isEmailConnected: false
        }
      }
    }

    const decrypted = JSON.parse(decryptConfig(snapshot.description))
    return {
      success: true,
      data: {
        ...decrypted,
        whatsappAccessTokenMasked: decrypted.whatsappAccessToken ? "••••••••" + decrypted.whatsappAccessToken.slice(-4) : "",
        isWhatsappConnected: !!decrypted.whatsappPhoneNumberId,
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

    const updated = {
      ...current,
      whatsappPhoneNumberId: credentials.whatsappPhoneNumberId || current.whatsappPhoneNumberId || "",
      whatsappWabaId: credentials.whatsappWabaId || current.whatsappWabaId || "",
      whatsappAccessToken: credentials.whatsappAccessToken || current.whatsappAccessToken || "",
      emailAddress: credentials.emailAddress || current.emailAddress || "",
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
