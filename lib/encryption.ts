import crypto from "crypto"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef" // Must be 32 bytes
const IV_LENGTH = 16

export function encryptConfig(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY), iv)
  
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:encryptedText
  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted.toString("hex")
}

export function decryptConfig(text: string): string {
  try {
    const textParts = text.split(":")
    const iv = Buffer.from(textParts[0], "hex")
    const authTag = Buffer.from(textParts[1], "hex")
    const encryptedText = Buffer.from(textParts[2], "hex")

    const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY), iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString()
  } catch (error) {
    console.error("Failed to decrypt config", error)
    return ""
  }
}
