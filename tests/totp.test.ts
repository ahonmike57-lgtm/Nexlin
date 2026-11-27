import { afterEach, describe, expect, it, vi } from "vitest"
import { computeTotp, verifyTotpCode } from "@/lib/totp"

describe("lib/totp", () => {
  const SECRET = "JBSWY3DPEHPK3PXP"

  afterEach(() => {
    vi.useRealTimers()
  })

  it("computes deterministic 6-digit zero-padded RFC 6238 codes", () => {
    // Standard RFC 6238 test vector for ASCII secret "12345678901234567890" (GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ)
    const rfcSecret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"
    // At t = 59s -> step = 1 -> 94287082 mod 1_000_000 = 287082
    expect(computeTotp(rfcSecret, 1)).toBe("287082")

    const code = computeTotp(SECRET, 1000)
    expect(code).toMatch(/^\d{6}$/)
    expect(computeTotp(SECRET, 1000)).toBe(code)
  })

  it("accepts current and +/-1 time steps and rejects further drift or malformed codes", () => {
    vi.useFakeTimers()
    const baseMs = 1_700_000_010_000
    vi.setSystemTime(baseMs)

    const step = Math.floor(baseMs / 1000 / 30)
    const currentCode = computeTotp(SECRET, step)
    const prevCode = computeTotp(SECRET, step - 1)
    const nextCode = computeTotp(SECRET, step + 1)
    const staleCode = computeTotp(SECRET, step - 2)
    const futureCode = computeTotp(SECRET, step + 2)

    expect(verifyTotpCode(SECRET, currentCode)).toBe(true)
    expect(verifyTotpCode(SECRET, ` ${prevCode} `)).toBe(true)
    expect(verifyTotpCode(SECRET, nextCode)).toBe(true)

    expect(verifyTotpCode(SECRET, staleCode)).toBe(false)
    expect(verifyTotpCode(SECRET, futureCode)).toBe(false)
    expect(verifyTotpCode(SECRET, "abcdef")).toBe(false)
    expect(verifyTotpCode(SECRET, "12345")).toBe(false)
    expect(verifyTotpCode(SECRET, "")).toBe(false)
  })
})
