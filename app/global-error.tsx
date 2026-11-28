"use client"

import { useEffect } from "react"
import {
  attemptOneShotReload,
  isDeploymentSkewError,
  reportClientError,
} from "@/lib/chunk-recovery"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const skew = isDeploymentSkewError(error)

  useEffect(() => {
    console.error("Global error boundary:", error)
    reportClientError(error, "global")
    if (isDeploymentSkewError(error)) {
      attemptOneShotReload()
    }
  }, [error])

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#0b0f19", color: "#f8fafc" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ maxWidth: "420px", width: "100%", background: "#111827", border: "1px solid #1f2937", borderRadius: "16px", padding: "32px", textAlign: "center" }}>
            <h2 style={{ margin: "0 0 10px", fontSize: "20px", fontWeight: 700 }}>
              Temporary Application Notice
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#9ca3af", lineHeight: 1.5 }}>
              {skew
                ? "A newer release of Nexlin just deployed. Reload to load the latest build."
                : "An unexpected client error occurred. Reload to recover cleanly."}
            </p>
            <button
              type="button"
              onClick={() => (skew ? window.location.reload() : reset())}
              style={{
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
