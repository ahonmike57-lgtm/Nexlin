function isPrivateOrLocalIpv4(host: string): boolean {
  const parts = host.split(".")
  if (parts.length !== 4) return false

  // Reject hex or octal obfuscated IPv4 octets
  if (parts.some((p) => /^0x/i.test(p) || (p.length > 1 && p.startsWith("0")))) {
    return true
  }

  if (!parts.every((p) => /^\d+$/.test(p))) {
    return false
  }

  const nums = parts.map(Number)
  if (nums.some((n) => n < 0 || n > 255)) {
    return true
  }

  const [a, b] = nums
  if (a === 0) return true // 0.0.0.0/8
  if (a === 10) return true // 10.0.0.0/8
  if (a === 127) return true // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true // 169.254.0.0/16 link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12
  if (a === 192 && b === 168) return true // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true // 100.64.0.0/10 CGNAT
  if (a >= 224) return true // Multicast / reserved

  return false
}

function isPrivateOrLocalIpv6(host: string): boolean {
  const normalized = host.toLowerCase().split("%")[0]
  if (
    normalized === "::1" ||
    normalized === "::" ||
    normalized === "0:0:0:0:0:0:0:1" ||
    normalized === "0:0:0:0:0:0:0:0"
  ) {
    return true
  }

  // IPv4-mapped IPv6 (e.g. ::ffff:7f00:1 or ::ffff:127.0.0.1)
  if (normalized.startsWith("::ffff:") || normalized.startsWith("0:0:0:0:0:ffff:")) {
    return true
  }

  // Unique local addresses (fc00::/7) and link-local (fe80::/10)
  if (/^(fc|fd)[0-9a-f]{2}:/.test(normalized) || /^fe[89ab][0-9a-f]:/.test(normalized)) {
    return true
  }

  return false
}

/**
 * Validates that an outbound webhook/integration URL is safe from SSRF
 * against loopback, link-local, metadata endpoints, and private network ranges.
 */
export function assertSafeOutboundUrl(rawUrl: string): URL {
  let parsed: URL
  try {
    parsed = new URL(rawUrl.trim())
  } catch {
    throw new Error("Unsafe outbound URL blocked: invalid URL syntax")
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Unsafe outbound URL blocked: only http and https protocols are allowed")
  }

  const host = parsed.hostname.toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "")
  if (!host) {
    throw new Error("Unsafe outbound URL blocked: missing hostname")
  }

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".home.arpa") ||
    host === "metadata.google.internal"
  ) {
    throw new Error("Unsafe outbound URL blocked: internal or local hostname not permitted")
  }

  // Reject raw integer or hex IP representations (e.g. http://2130706433 or http://0x7f000001)
  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) {
    throw new Error("Unsafe outbound URL blocked: numeric/hex IP address not permitted")
  }

  if (isPrivateOrLocalIpv4(host) || (host.includes(":") && isPrivateOrLocalIpv6(host))) {
    throw new Error("Unsafe outbound URL blocked: private or loopback IP range not permitted")
  }

  return parsed
}
