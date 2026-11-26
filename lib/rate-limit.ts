/**
 * In-Memory Sliding-Window Rate Limiter for Next.js API Routes and Server Actions.
 * Tracks request counts within rolling time windows.
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
      resetInSeconds: Math.max(1, resetInSeconds)
    }
  }

  record.timestamps.push(now)
  return {
    allowed: true,
    remaining: options.maxRequests - record.timestamps.length,
    resetInSeconds: options.windowSeconds
  }
}
