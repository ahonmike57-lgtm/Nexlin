import crypto from "crypto"

const IV_LENGTH = 16
let warnedMissingEncryptionKey = false

function getKeyBuffer(): Buffer {
  const configuredKey = process.env.ENCRYPTION_KEY?.trim()
  if (configuredKey) {
    return crypto.createHash("sha256").update(configuredKey).digest()
  }

  const authSecret = (process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET)?.trim()
  if (authSecret) {
    if (!warnedMissingEncryptionKey) {
      warnedMissingEncryptionKey = true
      console.warn(
        "[encryption] ENCRYPTION_KEY is not set; deriving a domain-separated key from NEXTAUTH_SECRET. Set a dedicated ENCRYPTION_KEY in production."
      )
    }
    return crypto.createHmac("sha256", authSecret).update("nexlin:config-encryption:v1").digest()
  }

  throw new Error("ENCRYPTION_KEY (or NEXTAUTH_SECRET) must be configured.")
}

export function encryptConfig(text: string): string {
  const keyBuffer = getKeyBuffer()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv)
  
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:encryptedText
  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted.toString("hex")
}

export function decryptConfig(text: string): string {
  const keyBuffer = getKeyBuffer()
  try {
    const textParts = text.split(":")
    if (textParts.length !== 3) return ""
    const iv = Buffer.from(textParts[0], "hex")
    const authTag = Buffer.from(textParts[1], "hex")
    const encryptedText = Buffer.from(textParts[2], "hex")

    const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString()
  } catch (error) {
    console.error("Failed to decrypt config", error)
    return ""
  }
}
