"use client"

import React, { useState } from "react"
import { RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react"
import { retryWebhookDelivery } from "@/app/actions/webhook-inspector"

interface WebhookDeliveryItem {
  id: string
  url: string
  event: string
  payload: string
  responseStatus: number | null
  responseBody: string | null
  success: boolean
  retryCount: number
  deliveredAt: any
}

export function WebhookInspector({ initialDeliveries }: { initialDeliveries: WebhookDeliveryItem[] }) {
  const [deliveries, setDeliveries] = useState<WebhookDeliveryItem[]>(initialDeliveries)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const handleRetry = async (id: string) => {
    setRetryingId(id)
    const res = await retryWebhookDelivery(id)
    if (res.success && res.delivery) {
      setDeliveries([res.delivery as any, ...deliveries])
    }
    setRetryingId(null)
  }

  return (
    <div className="bg-bg-primary rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-text-primary">Outbound Webhook Delivery Log</h4>
          <p className="text-xs text-text-secondary">Inspect HTTP payloads and trigger manual retries.</p>
        </div>
      </div>

      <div className="divide-y divide-border">
        {deliveries.length === 0 ? (
          <div className="p-6 text-center text-sm text-text-secondary">No webhook delivery logs recorded yet.</div>
        ) : (
          deliveries.map((d) => (
            <div key={d.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {d.success ? (
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-error flex-shrink-0" />
                  )}
                  <span className="font-semibold text-xs text-text-primary">{d.event}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-bg-secondary font-mono border border-border">
                    HTTP {d.responseStatus || "ERR"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-text-secondary flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(d.deliveredAt).toLocaleTimeString()}
                  </span>

                  <button
                    onClick={() => handleRetry(d.id)}
                    disabled={retryingId === d.id}
                    className="px-2.5 py-1 bg-bg-secondary border border-border text-text-primary hover:bg-primary/10 hover:text-primary text-xs font-semibold rounded flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${retryingId === d.id ? "animate-spin" : ""}`} />
                    Retry
                  </button>
                </div>
              </div>

              <div className="text-xs text-text-secondary font-mono truncate">{d.url}</div>

              {d.responseBody && (
                <div className="bg-bg-secondary p-2 rounded text-[11px] font-mono text-text-secondary truncate border border-border">
                  Response: {d.responseBody}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
