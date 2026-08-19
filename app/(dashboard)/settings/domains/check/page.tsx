"use client"

import { useState } from "react"
import { Globe, Search, Loader2, CheckCircle2, XCircle, AlertCircle, Shield, ShieldCheck, ShieldAlert } from "lucide-react"

type DnsRecord = {
  type: string
  value: string
  ttl?: number
}

type CheckResult = {
  domain: string
  ssl: {
    valid: boolean
    issuer?: string
    expires?: string
    daysLeft?: number
    protocol?: string
  } | null
  dns: DnsRecord[]
  httpStatus?: number
  redirectsTo?: string
  error?: string
  checkedAt: string
}

// Use the Certstream / public DNS-over-HTTPS APIs (no API key needed)
async function checkDomain(domain: string): Promise<CheckResult> {
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase().trim()

  const result: CheckResult = {
    domain: cleanDomain,
    ssl: null,
    dns: [],
    checkedAt: new Date().toLocaleString(),
  }

  try {
    // 1. DNS A records via Cloudflare DoH
    const dohRes = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=A`,
      { headers: { Accept: "application/dns-json" } }
    )
    if (dohRes.ok) {
      const dohData = await dohRes.json()
      if (dohData.Answer) {
        result.dns.push(...dohData.Answer.map((r: any) => ({
          type: r.type === 1 ? "A" : r.type === 28 ? "AAAA" : `Type${r.type}`,
          value: r.data,
          ttl: r.TTL,
        })))
      }
    }

    // 2. MX records
    const mxRes = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=MX`,
      { headers: { Accept: "application/dns-json" } }
    )
    if (mxRes.ok) {
      const mxData = await mxRes.json()
      if (mxData.Answer) {
        result.dns.push(...mxData.Answer.map((r: any) => ({
          type: "MX",
          value: r.data,
          ttl: r.TTL,
        })))
      }
    }

    // 3. SSL check via crt.sh (public CT log)
    const crtRes = await fetch(
      `https://crt.sh/?q=${cleanDomain}&output=json`
    )
    if (crtRes.ok) {
      const certs: any[] = await crtRes.json()
      if (certs.length > 0) {
        // Most recent cert
        const latest = certs.sort((a, b) => new Date(b.not_after).getTime() - new Date(a.not_after).getTime())[0]
        const expiresAt = new Date(latest.not_after)
        const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)
        result.ssl = {
          valid: daysLeft > 0,
          issuer: latest.issuer_name?.split(",").find((p: string) => p.trim().startsWith("O="))?.split("=")[1]?.trim() ?? latest.issuer_name,
          expires: expiresAt.toLocaleDateString(),
          daysLeft,
          protocol: "TLS",
        }
      } else {
        result.ssl = { valid: false }
      }
    }
  } catch (e: any) {
    result.error = e.message ?? "Network error — check browser CORS or domain name"
  }

  return result
}

export default function DomainCheckPage() {
  const [domain, setDomain] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [history, setHistory] = useState<string[]>([])

  const handleCheck = async () => {
    if (!domain.trim()) return
    setLoading(true)
    setResult(null)
    const res = await checkDomain(domain)
    setResult(res)
    setHistory((prev) => [res.domain, ...prev.filter((d) => d !== res.domain)].slice(0, 5))
    setLoading(false)
  }

  const sslColor = result?.ssl
    ? result.ssl.valid && (result.ssl.daysLeft ?? 0) > 30
      ? "text-success"
      : result.ssl.valid && (result.ssl.daysLeft ?? 0) > 7
      ? "text-warning"
      : "text-error"
    : "text-text-secondary"

  const SslIcon = result?.ssl
    ? result.ssl.valid && (result.ssl.daysLeft ?? 0) > 30
      ? ShieldCheck
      : result.ssl.valid && (result.ssl.daysLeft ?? 0) > 7
      ? ShieldAlert
      : Shield
    : Shield

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Globe className="w-6 h-6 text-primary" />
          Domain & SSL Checker
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Check DNS records and SSL certificate status for any custom domain
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            placeholder="example.com or app.youragency.com"
            className="w-full pl-9 pr-4 py-3 bg-bg-primary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button
          onClick={handleCheck}
          disabled={loading || !domain.trim()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-medium text-sm disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? "Checking…" : "Check"}
        </button>
      </div>

      {/* Recent History */}
      {history.length > 0 && !result && (
        <div>
          <p className="text-xs font-medium text-text-secondary mb-2">Recent checks</p>
          <div className="flex flex-wrap gap-2">
            {history.map((d) => (
              <button
                key={d}
                onClick={() => { setDomain(d); }}
                className="text-xs px-3 py-1.5 rounded-full border border-border text-text-secondary hover:text-primary hover:border-primary/50 transition-colors"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {result.error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-error/10 border border-error/30">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-error">Check Failed</p>
                <p className="text-xs text-text-secondary mt-1">{result.error}</p>
                <p className="text-xs text-text-secondary mt-1">Note: CORS restrictions may prevent some checks. DNS lookup should still work.</p>
              </div>
            </div>
          )}

          {/* SSL Card */}
          <div className="bg-bg-primary border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <SslIcon className={`w-5 h-5 ${sslColor}`} />
              <h3 className="font-semibold text-text-primary">SSL Certificate</h3>
            </div>
            {result.ssl ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-secondary mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    {result.ssl.valid ? (
                      <><CheckCircle2 className="w-4 h-4 text-success" /><span className="text-sm font-medium text-success">Valid</span></>
                    ) : (
                      <><XCircle className="w-4 h-4 text-error" /><span className="text-sm font-medium text-error">Invalid / Expired</span></>
                    )}
                  </div>
                </div>
                {result.ssl.issuer && (
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Issuer</p>
                    <p className="text-sm text-text-primary">{result.ssl.issuer}</p>
                  </div>
                )}
                {result.ssl.expires && (
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Expires</p>
                    <p className="text-sm text-text-primary">{result.ssl.expires}</p>
                  </div>
                )}
                {result.ssl.daysLeft !== undefined && (
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Days Remaining</p>
                    <p className={`text-sm font-semibold ${sslColor}`}>{result.ssl.daysLeft} days</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No SSL certificate found in public CT logs for this domain.</p>
            )}
          </div>

          {/* DNS Records */}
          <div className="bg-bg-primary border border-border rounded-xl p-5">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              DNS Records
              <span className="ml-auto text-xs font-normal text-text-secondary">{result.dns.length} record{result.dns.length !== 1 ? "s" : ""} found</span>
            </h3>
            {result.dns.length > 0 ? (
              <div className="space-y-2">
                {result.dns.map((rec, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg-secondary">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded font-mono w-10 text-center flex-shrink-0">
                      {rec.type}
                    </span>
                    <span className="text-sm font-mono text-text-primary flex-1 truncate">{rec.value}</span>
                    {rec.ttl !== undefined && (
                      <span className="text-xs text-text-secondary flex-shrink-0">TTL {rec.ttl}s</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No A or MX records found. The domain may not exist or DNS is not propagated.</p>
            )}
          </div>

          {/* Footer */}
          <p className="text-xs text-text-secondary text-right">
            Checked at {result.checkedAt} · via Cloudflare DoH + crt.sh
          </p>
        </div>
      )}
    </div>
  )
}
