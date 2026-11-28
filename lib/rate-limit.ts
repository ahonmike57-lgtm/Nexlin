/**
 * Sliding-Window Rate Limiter for Next.js API Routes and Server Actions.
 * Uses Upstash Redis REST (when UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN
 * are configured) for distributed enforcement across serverless instances, and
 * falls back cleanly to a bounded in-memory sliding-window store.
 */

interface RateLimitRecord {
  timestamps: number[]
}

const MAX_STORE_KEYS = 10_000
const rateLimitStore = new Map<string, RateLimitRecord>()

// Cleanup stale rate limit records every 5 minutes without keeping the event loop alive
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 300000)
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key)
      }
    }
  }, 300000)
  ;(cleanupTimer as { unref?: () => void }).unref?.()
}

export interface RateLimitOptions {
  /** Maximum number of allowed requests in the time window */
  maxRequests: number
  /** Duration of the window in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInSeconds: number
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 60, windowSeconds: 60 }
): RateLimitResult {
  const now = Date.now()
  const windowMs = options.windowSeconds * 1000

  let record = rateLimitStore.get(identifier)
  if (!record) {
    if (rateLimitStore.size >= MAX_STORE_KEYS) {
      const oldestKey = rateLimitStore.keys().next().value
      if (oldestKey !== undefined) {
        rateLimitStore.delete(oldestKey)
      }
    }
    record = { timestamps: [] }
    rateLimitStore.set(identifier, record)
  }

  // Remove timestamps outside the sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs)

  if (record.timestamps.length >= options.maxRequests) {
    const oldest = record.timestamps[0]
    const resetInSeconds = Math.ceil((oldest + windowMs - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, resetInSeconds),
    }
  }

  record.timestamps.push(now)
  return {
    allowed: true,
    remaining: options.maxRequests - record.timestamps.length,
    resetInSeconds: options.windowSeconds,
  }
}

export async function checkRateLimitAsync(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 60, windowSeconds: 60 }
): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

  if (!upstashUrl || !upstashToken) {
    return checkRateLimit(identifier, options)
  }

  const windowSeconds = Math.max(1, Math.floor(options.windowSeconds))
  const windowMs = windowSeconds * 1000
  const now = Date.now()
  const bucket = Math.floor(now / windowMs)
  const bucketKey = `rl:${identifier}:${bucket}`
  const resetInSeconds = Math.max(1, Math.ceil(((bucket + 1) * windowMs - now) / 1000))

  try {
    const res = await fetch(`${upstashUrl.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${upstashToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", bucketKey],
        ["EXPIRE", bucketKey, windowSeconds, "NX"],
      ]),
      signal: AbortSignal.timeout(1500),
    })

    if (!res.ok) {
      return checkRateLimit(identifier, options)
    }

    const data = (await res.json()) as Array<{ result?: unknown; error?: string }>
    const rawCount = Array.isArray(data) ? Number(data[0]?.result) : NaN
    if (!Number.isFinite(rawCount) || rawCount <= 0) {
      return checkRateLimit(identifier, options)
    }

    return {
      allowed: rawCount <= options.maxRequests,
      remaining: Math.max(0, options.maxRequests - rawCount),
      resetInSeconds,
    }
  } catch {
    return checkRateLimit(identifier, options)
  }
}
