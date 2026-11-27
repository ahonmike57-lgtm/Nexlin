import crypto from "crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { dbMock } = vi.hoisted(() => ({
  dbMock: {
    apiKey: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    webhookDelivery: {
      create: vi.fn(),
    },
    webhook: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/db", () => ({
  db: dbMock,
}))

import {
  logWebhookDelivery,
  verifyApiKeyForAgency,
  verifyMetaSignature,
  verifySharedSecret,
  verifyShopifySignature,
  verifyTwilioWebhookRequest,
} from "@/lib/webhooks"

function signTwilioUrl(authToken: string, url: string, params: Record<string, string>) {
  const sortedKeys = Object.keys(params).sort()
  let payload = url
  for (const key of sortedKeys) {
    payload += key + params[key]
  }
  return crypto.createHmac("sha1", authToken).update(Buffer.from(payload, "utf-8")).digest("base64")
}

describe("lib/webhooks", () => {
  const origEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...origEnv }
  })

  afterEach(() => {
    process.env = origEnv
  })

  it("verifies shared secrets in constant time", () => {
    expect(verifySharedSecret("my-secret", "my-secret")).toBe(true)
    expect(verifySharedSecret("wrong", "my-secret")).toBe(false)
    expect(verifySharedSecret(null, "my-secret")).toBe(false)
    expect(verifySharedSecret("my-secret", undefined)).toBe(false)
  })

  it("verifies Meta HMAC-SHA256 signatures and rejects tampering", () => {
    const body = '{"entry":[]}'
    const secret = "meta-app-secret"
    const hex = crypto.createHmac("sha256", secret).update(body).digest("hex")

    expect(verifyMetaSignature(body, `sha256=${hex}`, secret)).toBe(true)
    expect(verifyMetaSignature(`${body} `, `sha256=${hex}`, secret)).toBe(false)
    expect(verifyMetaSignature(body, `sha256=${hex}`, "other-secret")).toBe(false)
    expect(verifyMetaSignature(body, null, secret)).toBe(false)
  })

  it("verifies Shopify base64 HMAC-SHA256 signatures", () => {
    const body = '{"order_number":1001}'
    const secret = "shopify-secret"
    const hmac = crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64")

    expect(verifyShopifySignature(body, hmac, secret)).toBe(true)
    expect(verifyShopifySignature(body, "invalid-hmac", secret)).toBe(false)
    expect(verifyShopifySignature(body, null, secret)).toBe(false)
  })

  it("enforces Twilio signature validation and supports proxied public URLs", () => {
    const token = "twilio-auth-token-123"
    const params = { From: "+14155550100", Body: "Hello" }
    process.env.TWILIO_AUTH_TOKEN = token

    const unsignedReq = new Request("https://app.example.com/api/webhooks/twilio", {
      method: "POST",
    })
    expect(verifyTwilioWebhookRequest(unsignedReq, params)).toEqual({
      valid: false,
      status: 401,
      error: "Missing Twilio signature",
    })

    const publicUrl = "https://crm.customer.com/api/webhooks/twilio"
    const sig = signTwilioUrl(token, publicUrl, params)
    const proxiedReq = new Request("http://127.0.0.1:3000/api/webhooks/twilio", {
      method: "POST",
      headers: {
        "x-forwarded-proto": "https",
        "x-forwarded-host": "crm.customer.com",
        "x-twilio-signature": sig,
      },
    })
    expect(verifyTwilioWebhookRequest(proxiedReq, params)).toEqual({ valid: true })

    delete process.env.TWILIO_AUTH_TOKEN
    ;(process.env as Record<string, string | undefined>).NODE_ENV = "production"
    expect(verifyTwilioWebhookRequest(unsignedReq, params)).toEqual({
      valid: false,
      status: 503,
      error: "Twilio webhook verification not configured",
    })
  })

  it("resolves active API keys by SHA-256 hash and rejects expired keys", async () => {
    const rawKey = "nx_live_testsecret12345"
    const expectedHash = crypto.createHash("sha256").update(rawKey).digest("hex")

    dbMock.apiKey.findFirst.mockResolvedValueOnce({
      id: "key_1",
      agencyId: "agency_abc",
      expiresAt: null,
    })
    dbMock.apiKey.update.mockResolvedValueOnce({})

    const verified = await verifyApiKeyForAgency(`Bearer ${rawKey}`)
    expect(verified).toEqual({ agencyId: "agency_abc", apiKeyId: "key_1" })
    expect(dbMock.apiKey.findFirst).toHaveBeenCalledWith({
      where: { keyHash: expectedHash, status: "active" },
      select: { id: true, agencyId: true, expiresAt: true },
    })

    dbMock.apiKey.findFirst.mockResolvedValueOnce({
      id: "key_2",
      agencyId: "agency_abc",
      expiresAt: new Date(Date.now() - 60_000),
    })
    expect(await verifyApiKeyForAgency(`Bearer ${rawKey}`)).toBeNull()
  })

  it("never logs unattributed webhook deliveries without agencyId", async () => {
    const result = await logWebhookDelivery({
      event: "webhook.test",
      payload: { ok: true },
      statusCode: 200,
    })

    expect(result).toBeNull()
    expect(dbMock.webhookDelivery.create).not.toHaveBeenCalled()
  })
})
