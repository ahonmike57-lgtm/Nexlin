import crypto from "crypto"

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

/**
 * Compute TOTP token for given Base32 secret and 30-second time step (RFC 6238 HMAC-SHA1)
 */
export function computeTotp(secret: string, timeStep: number): string {
  let bits = ""
  for (let i = 0; i < secret.length; i++) {
    const val = BASE32_CHARS.indexOf(secret.charAt(i).toUpperCase())
    if (val === -1) continue
    bits += val.toString(2).padStart(5, "0")
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2))
  }
  const key = Buffer.from(bytes)

  const timeBuffer = Buffer.alloc(8)
  timeBuffer.writeBigInt64BE(BigInt(timeStep))

  const hmac = crypto.createHmac("sha1", key).update(timeBuffer).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  return (code % 1000000).toString().padStart(6, "0")
}

/**
 * Verify a 6-digit TOTP token with ±1 step drift tolerance using constant-time comparison.
 */
export function verifyTotpCode(secret: string, token: string): boolean {
  const clean = token.trim()
  if (!/^\d{6}$/.test(clean)) return false

  const currentStep = Math.floor(Date.now() / 1000 / 30)
  for (let stepOffset = -1; stepOffset <= 1; stepOffset++) {
    const expected = computeTotp(secret, currentStep + stepOffset)
    if (
      expected.length === clean.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(clean))
    ) {
      return true
    }
  }
  return false
}
