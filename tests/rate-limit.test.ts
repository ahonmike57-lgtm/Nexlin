import { afterEach, describe, expect, it, vi } from "vitest"
import { checkRateLimit } from "@/lib/rate-limit"

describe("lib/rate-limit", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("enforces maxRequests within the sliding window and recovers after window expiry", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))

    const key = "test-sliding-window-key"

    const r1 = checkRateLimit(key, { maxRequests: 2, windowSeconds: 60 })
    const r2 = checkRateLimit(key, { maxRequests: 2, windowSeconds: 60 })
    const r3 = checkRateLimit(key, { maxRequests: 2, windowSeconds: 60 })

    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(1)
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(0)

    expect(r3.allowed).toBe(false)
    expect(r3.remaining).toBe(0)
    expect(r3.resetInSeconds).toBe(60)

    vi.advanceTimersByTime(61_000)

    const r4 = checkRateLimit(key, { maxRequests: 2, windowSeconds: 60 })
    expect(r4.allowed).toBe(true)
    expect(r4.remaining).toBe(1)
  })
})
