import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { decryptConfig, encryptConfig } from "@/lib/encryption"

describe("lib/encryption", () => {
  const origEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...origEnv }
  })

  afterEach(() => {
    process.env = origEnv
  })

  it("round-trips plaintext when ENCRYPTION_KEY is set", () => {
    process.env.ENCRYPTION_KEY = "super-secret-encryption-key-for-tests"
    const secret = "shpat_1234567890abcdef_live_token"
    const cipher = encryptConfig(secret)

    expect(cipher.split(":")).toHaveLength(3)
    expect(cipher).not.toContain(secret)
    expect(decryptConfig(cipher)).toBe(secret)
  })

  it("uses a unique random IV per encryption call", () => {
    process.env.ENCRYPTION_KEY = "super-secret-encryption-key-for-tests"
    const a = encryptConfig("identical-secret")
    const b = encryptConfig("identical-secret")

    expect(a).not.toBe(b)
    expect(decryptConfig(a)).toBe("identical-secret")
    expect(decryptConfig(b)).toBe("identical-secret")
  })

  it("returns empty string on malformed or tampered ciphertext", () => {
    process.env.ENCRYPTION_KEY = "super-secret-encryption-key-for-tests"
    vi.spyOn(console, "error").mockImplementation(() => {})

    const valid = encryptConfig("hello")
    const [iv, tag, data] = valid.split(":")
    const flipped = `${iv}:${tag}:${data.slice(0, -2)}ff`

    expect(decryptConfig("not:valid")).toBe("")
    expect(decryptConfig(flipped)).toBe("")
  })

  it("falls back cleanly to NEXTAUTH_SECRET when ENCRYPTION_KEY is absent", () => {
    delete process.env.ENCRYPTION_KEY
    process.env.NEXTAUTH_SECRET = "nextauth-secret-value"
    vi.spyOn(console, "warn").mockImplementation(() => {})

    const cipher = encryptConfig("oauth-token")
    expect(decryptConfig(cipher)).toBe("oauth-token")

    process.env.NEXTAUTH_SECRET = "different-nextauth-secret"
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(decryptConfig(cipher)).toBe("")
  })

  it("throws when neither ENCRYPTION_KEY nor auth secret is set", () => {
    delete process.env.ENCRYPTION_KEY
    delete process.env.NEXTAUTH_SECRET
    delete process.env.AUTH_SECRET

    expect(() => encryptConfig("test")).toThrow(
      "ENCRYPTION_KEY (or NEXTAUTH_SECRET) must be configured."
    )
    expect(() => decryptConfig("aa:bb:cc")).toThrow(
      "ENCRYPTION_KEY (or NEXTAUTH_SECRET) must be configured."
    )
  })
})
