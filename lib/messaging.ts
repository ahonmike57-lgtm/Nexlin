import "server-only"
import twilio from "twilio"
import { Resend } from "resend"
import Pusher from "pusher"
import { db } from "@/lib/db"
import { decryptConfig } from "@/lib/encryption"

export type Channel = "sms" | "whatsapp" | "email"

export interface ChannelCredentials {
  whatsappPhoneNumberId?: string
  whatsappWabaId?: string
  whatsappAccessToken?: string
  whatsappDisplayNumber?: string
  emailAddress?: string
}

export interface DeliveryResult {
  ok: boolean
  providerId?: string
  error?: string
}

const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0"

/** Loads and decrypts an agency's stored channel credentials. */
export async function loadChannelCredentials(agencyId: string): Promise<ChannelCredentials> {
  const snapshot = await db.snapshot.findFirst({
    where: { agencyId, name: "channel_credentials" },
  })
  if (!snapshot?.description) return {}
  try {
    return JSON.parse(decryptConfig(snapshot.description))
  } catch {
    return {}
  }
}

/**
 * Finds the agency that owns a given WhatsApp phone_number_id.
 * Credentials are stored encrypted, so this decrypts each agency's record.
 * Fine for small/medium tenant counts; move phoneNumberId to an indexed
 * column if tenant count grows large.
 */
export async function findAgencyByWhatsappPhoneNumberId(phoneNumberId: string): Promise<string | null> {
  const snapshots = await db.snapshot.findMany({
    where: { name: "channel_credentials" },
    select: { agencyId: true, description: true },
  })
  for (const s of snapshots) {
    if (!s.description) continue
    try {
      const creds = JSON.parse(decryptConfig(s.description)) as ChannelCredentials
      if (creds.whatsappPhoneNumberId === phoneNumberId) return s.agencyId
    } catch {
      // skip unreadable record
    }
  }
  return null
}

/** Normalizes a phone number to E.164-ish digits with leading '+'. */
function toE164(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "")
  return digits.startsWith("+") ? digits : `+${digits}`
}

/** Checks WhatsApp credentials against Meta and returns the display number. */
export async function verifyWhatsappCredentials(phoneNumberId: string, accessToken: string) {
  const res = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,verified_name`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  )
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = body?.error
    return { ok: false as const, error: err ? `Meta error ${err.code}: ${err.message}` : `Meta returned HTTP ${res.status}` }
  }
  return {
    ok: true as const,
    displayNumber: body.display_phone_number as string | undefined,
    verifiedName: body.verified_name as string | undefined,
  }
}

async function sendWhatsapp(creds: ChannelCredentials, to: string, content: string): Promise<DeliveryResult> {
  if (!creds.whatsappPhoneNumberId || !creds.whatsappAccessToken) {
    return { ok: false, error: "WhatsApp is not connected. Add your Phone Number ID and access token first." }
  }
  const res = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(creds.whatsappPhoneNumberId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.whatsappAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toE164(to).replace("+", ""),
        type: "text",
        text: { preview_url: false, body: content },
      }),
    }
  )
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = body?.error
    // 131047 = outside the 24h customer-service window -> needs an approved template.
    if (err?.code === 131047) {
      return {
        ok: false,
        error: "More than 24 hours since this customer last messaged you. WhatsApp only allows approved template messages until they reply.",
      }
    }
    return { ok: false, error: err ? `WhatsApp error ${err.code}: ${err.message}` : `WhatsApp HTTP ${res.status}` }
  }
  return { ok: true, providerId: body?.messages?.[0]?.id }
}

async function sendSms(agencyId: string, to: string, content: string): Promise<DeliveryResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) {
    return { ok: false, error: "SMS is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN missing)." }
  }
  const owned = await db.phoneNumber.findFirst({
    where: { agencyId, status: "active", provider: "twilio" },
    orderBy: { createdAt: "asc" },
  })
  const from = owned?.number || process.env.TWILIO_PHONE_NUMBER
  if (!from) {
    return { ok: false, error: "No SMS sending number. Buy or add a number in Settings → Phone Numbers." }
  }
  try {
    const client = twilio(sid, token)
    const msg = await client.messages.create({ body: content, from, to: toE164(to) })
    return { ok: true, providerId: msg.sid }
  } catch (e: any) {
    return { ok: false, error: `Twilio error${e?.code ? ` ${e.code}` : ""}: ${e?.message || "send failed"}` }
  }
}

async function sendEmail(creds: ChannelCredentials, to: string, content: string, subject?: string): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY missing)." }
  }
  const from = creds.emailAddress || process.env.RESEND_FROM_EMAIL
  if (!from) {
    return { ok: false, error: "No sender address. Connect an email address on a domain verified in Resend." }
  }
  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: subject || "New message",
      text: content,
    })
    if (error) return { ok: false, error: `Email error: ${error.message}` }
    return { ok: true, providerId: data?.id }
  } catch (e: any) {
    return { ok: false, error: `Email error: ${e?.message || "send failed"}` }
  }
}

/** Delivers an outbound message through the real provider for the channel. */
export async function deliverMessage(params: {
  agencyId: string
  channel: Channel
  contact: { phone?: string | null; email?: string | null }
  content: string
  subject?: string
}): Promise<DeliveryResult> {
  const { agencyId, channel, contact, content, subject } = params

  if (channel === "email") {
    if (!contact.email) return { ok: false, error: "This contact has no email address." }
    const creds = await loadChannelCredentials(agencyId)
    return sendEmail(creds, contact.email, content, subject)
  }

  if (!contact.phone) return { ok: false, error: "This contact has no phone number." }

  if (channel === "whatsapp") {
    const creds = await loadChannelCredentials(agencyId)
    return sendWhatsapp(creds, contact.phone, content)
  }

  return sendSms(agencyId, contact.phone, content)
}

let pusherSingleton: Pusher | null = null

/** Fire-and-forget realtime broadcast of a new message (no-op if Pusher unset). */
export function broadcastNewMessage(message: {
  id: string
  conversationId: string
  content: string
  isOutbound: boolean
  status: string
  createdAt: Date
}) {
  const appId = process.env.PUSHER_APP_ID
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY
  const secret = process.env.PUSHER_SECRET
  if (!appId || !key || !secret) return
  if (!pusherSingleton) {
    pusherSingleton = new Pusher({
      appId,
      key,
      secret,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER || "mt1",
      useTLS: true,
    })
  }
  pusherSingleton
    .trigger(`conversation-${message.conversationId}`, "new-message", message)
    .catch((err) => console.warn("Pusher trigger failed:", err))
}
