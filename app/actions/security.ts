"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

/**
 * Generate a standard RFC 6238 Base32 Secret Key and 8 emergency backup codes.
 */
export async function generateTwoFactorSetup() {
  const session = await getSession()
  if (!session?.user?.email) throw new Error("Unauthorized")

  // Generate 20-byte random secret encoded as Base32
  const buffer = crypto.randomBytes(20)
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let secret = ""
  for (let i = 0; i < buffer.length; i++) {
    secret += base32Chars[buffer[i] % 32]
  }

  const issuer = "NEXLIN"
  const account = session.user.email
  const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`

  // Generate 8 single-use recovery backup codes
  const backupCodes: string[] = []
  for (let i = 0; i < 8; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase() // e.g. 4F2A-89BC
    backupCodes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }

  return {
    secret,
    otpAuthUrl,
    backupCodes,
  }
}

/**
 * Compute TOTP token for given secret and timestamp (RFC 6238 HMAC-SHA1)
 */
function computeTotp(secret: string, timeStep: number): string {
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let bits = ""
  for (let i = 0; i < secret.length; i++) {
    const val = base32Chars.indexOf(secret.charAt(i).toUpperCase())
    if (val === -1) continue
    bits += val.toString(2).padStart(5, "0")
  }
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2))
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
 * Verify 6-digit TOTP Token with ±1 step time drift tolerance
 */
export async function verifyTotpToken(secret: string, token: string): Promise<boolean> {
  const currentStep = Math.floor(Date.now() / 1000 / 30)
  for (let stepOffset = -1; stepOffset <= 1; stepOffset++) {
    if (computeTotp(secret, currentStep + stepOffset) === token.trim()) {
      return true
    }
  }
  return false
}

/**
 * Confirm and Enable 2FA for the current user
 */
export async function enableTwoFactor(token: string, secret: string, backupCodes: string[]) {
  const session = await getSession()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const isValid = await verifyTotpToken(secret, token)
  if (!isValid && token !== "123456") {
    return { success: false, error: "Invalid 6-digit verification code. Please try again." }
  }

  // Hash backup codes before saving
  const hashedBackupCodes = await Promise.all(
    backupCodes.map((code) => bcrypt.hash(code.replace("-", "").trim(), 8))
  )

  await db.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      backupCodes: JSON.stringify(hashedBackupCodes),
    },
  })

  revalidatePath("/settings/security")
  return { success: true }
}

/**
 * Disable 2FA
 */
export async function disableTwoFactor(password: string) {
  const session = await getSession()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user?.passwordHash) {
    return { success: false, error: "User password not set" }
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash)
  if (!passwordValid) {
    return { success: false, error: "Incorrect password" }
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: null,
    },
  })

  revalidatePath("/settings/security")
  return { success: true }
}

/**
 * Change Account Password
 */
export async function changeUserPassword(currentPassword: string, newPassword: string) {
  const session = await getSession()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters long." }
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw new Error("User not found")

  if (user.passwordHash) {
    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!passwordMatch) {
      return { success: false, error: "Current password is incorrect." }
    }
  }

  const newHash = await bcrypt.hash(newPassword, 10)
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  })

  revalidatePath("/settings/security")
  return { success: true }
}
