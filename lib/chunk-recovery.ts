const SKEW_PATTERNS = [
  "chunkloaderror",
  "loading chunk",
  "failed to load chunk",
  "unrecognizedactionerror",
  "failed to find server action",
  "was not found on the server",
]

export function isDeploymentSkewError(error: unknown): boolean {
  if (!error) return false
  const name =
    typeof error === "object" && "name" in error && typeof (error as { name?: unknown }).name === "string"
      ? (error as { name: string }).name
      : ""
  const message =
    typeof error === "string"
      ? error
      : typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : ""
  const combined = `${name} ${message}`.toLowerCase()
  return SKEW_PATTERNS.some((pattern) => combined.includes(pattern))
}

export function attemptOneShotReload(
  key = "nexlin_skew_reload_at",
  cooldownMs = 30_000
): boolean {
  if (typeof window === "undefined") return false
  try {
    const prevRaw = window.sessionStorage.getItem(key)
    const prevTs = prevRaw ? Number(prevRaw) : 0
    const now = Date.now()
    if (Number.isFinite(prevTs) && prevTs > 0 && now - prevTs < cooldownMs) {
      return false
    }
    window.sessionStorage.setItem(key, String(now))
    window.location.reload()
    return true
  } catch {
    return false
  }
}

export function reportClientError(
  error: Error & { digest?: string },
  boundary: string
): void {
  if (typeof window === "undefined") return
  try {
    void fetch("/api/monitoring/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boundary,
        name: error?.name || "Error",
        message: error?.message || "Unknown client error",
        digest: error?.digest,
        path: window.location.pathname,
        isSkew: isDeploymentSkewError(error),
      }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Never throw from client error telemetry
  }
}
