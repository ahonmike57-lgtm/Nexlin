import { assertSafeOutboundUrl } from "@/lib/ssrf"

export interface ParsedSentryDsn {
  envelopeUrl: string
  authHeader: string
  dsn: string
}

export function parseSentryDsn(rawDsn: string): ParsedSentryDsn | null {
  try {
    const trimmed = rawDsn.trim()
    if (!trimmed) return null
    const parsed = new URL(trimmed)
    if (parsed.protocol !== "https:" || !parsed.username) {
      return null
    }
    const projectId = parsed.pathname.replace(/^\/+|\/+$/g, "")
    if (!/^\d+$/.test(projectId)) {
      return null
    }
    const publicKey = parsed.username
    const host = parsed.host
    return {
      dsn: trimmed,
      envelopeUrl: `https://${host}/api/${projectId}/envelope/`,
      authHeader: `Sentry sentry_version=7, sentry_client=nexlin-ghl/1.0, sentry_key=${publicKey}`,
    }
  } catch {
    return null
  }
}

function truncateText(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}…` : trimmed
}

function extractErrorFields(error: unknown) {
  if (error instanceof Error) {
    return {
      name: truncateText(error.name, 120) || "Error",
      message: truncateText(error.message, 1000) || "Unknown error",
      stack: truncateText(error.stack, 3000),
      digest: truncateText((error as Error & { digest?: string }).digest, 120),
    }
  }
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>
    return {
      name: truncateText(obj.name, 120) || "Error",
      message: truncateText(obj.message, 1000) || JSON.stringify(obj).slice(0, 500),
      stack: truncateText(obj.stack, 3000),
      digest: truncateText(obj.digest, 120),
    }
  }
  return {
    name: "Error",
    message: truncateText(String(error), 1000) || "Unknown error",
    stack: undefined,
    digest: undefined,
  }
}

export async function reportServerError(
  error: unknown,
  context: Record<string, unknown> = {}
): Promise<void> {
  const errFields = extractErrorFields(error)
  const payload = {
    level: "error",
    service: "nexlin-ghl",
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    error: errFields,
    context,
  }

  console.error(JSON.stringify(payload))

  const sentryDsn = process.env.SENTRY_DSN?.trim()
  if (sentryDsn) {
    const parsed = parseSentryDsn(sentryDsn)
    if (parsed) {
      try {
        const eventId =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID().replace(/-/g, "")
            : `${Date.now()}000000000000`.slice(0, 32)
        const envelopeHeader = JSON.stringify({
          event_id: eventId,
          sent_at: payload.timestamp,
          dsn: parsed.dsn,
        })
        const itemHeader = JSON.stringify({ type: "event" })
        const eventBody = JSON.stringify({
          event_id: eventId,
          timestamp: Math.floor(Date.now() / 1000),
          level: "error",
          platform: "javascript",
          environment: payload.environment,
          exception: {
            values: [{ type: errFields.name, value: errFields.message }],
          },
          extra: {
            digest: errFields.digest,
            ...context,
          },
        })
        await fetch(parsed.envelopeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-sentry-envelope",
            "X-Sentry-Auth": parsed.authHeader,
          },
          body: `${envelopeHeader}\n${itemHeader}\n${eventBody}`,
          signal: AbortSignal.timeout(2000),
        })
      } catch {
        // Never throw from error monitoring
      }
    }
  }

  const webhookUrl = process.env.ERROR_REPORTING_WEBHOOK_URL?.trim()
  if (webhookUrl) {
    try {
      const safeUrl = assertSafeOutboundUrl(webhookUrl)
      if (safeUrl.protocol === "https:") {
        await fetch(safeUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(2000),
        })
      }
    } catch {
      // Never throw or bypass SSRF checks
    }
  }
}
