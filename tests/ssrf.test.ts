import { describe, expect, it } from "vitest"
import { assertSafeOutboundUrl } from "@/lib/ssrf"

describe("lib/ssrf", () => {
  it("allows public http and https URLs", () => {
    expect(assertSafeOutboundUrl("https://hooks.example.com/events").hostname).toBe("hooks.example.com")
    expect(assertSafeOutboundUrl(" http://api.partner-crm.io/v1/hook ").protocol).toBe("http:")
  })

  it("blocks dangerous schemes", () => {
    for (const url of ["file:///etc/passwd", "javascript:alert(1)", "ftp://example.com/file"]) {
      expect(() => assertSafeOutboundUrl(url)).toThrow(/Unsafe outbound URL blocked/)
    }
  })

  it("blocks localhost, internal hostnames, metadata endpoints, and private IP ranges", () => {
    const blockedUrls = [
      "http://localhost:3000/api",
      "http://sub.localhost/test",
      "http://service.local/hook",
      "http://db.internal/query",
      "http://metadata.google.internal/computeMetadata/v1/",
      "http://127.0.0.1/admin",
      "http://10.0.0.5/internal",
      "http://172.16.4.20/hook",
      "http://192.168.1.10/router",
      "http://169.254.169.254/latest/meta-data/",
      "http://100.64.12.1/cgnat",
      "http://0.0.0.0/",
      "http://2130706433/",
      "http://0x7f000001/",
      "http://0177.0.0.1/",
      "http://[::1]:8080/",
      "http://[::ffff:127.0.0.1]/",
      "http://[fc00::1]/",
      "http://[fe80::1]/",
    ]

    for (const url of blockedUrls) {
      expect(() => assertSafeOutboundUrl(url), `expected SSRF block for ${url}`).toThrow(
        /Unsafe outbound URL blocked/
      )
    }
  })
})
