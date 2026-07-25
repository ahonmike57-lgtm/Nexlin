"use client"

import React, { useState } from "react"
import { Key, Plus, Trash2, Copy, Check, ShieldCheck } from "lucide-react"
import { createApiKey, revokeApiKey } from "@/app/actions/api-keys"

interface ApiKeyItem {
  id: string
  name: string
  keyPrefix: string
  scopes: string[]
  status: string
  createdAt: any
}

export function ApiKeyManagement({ initialKeys }: { initialKeys: ApiKeyItem[] }) {
  const [keys, setKeys] = useState<ApiKeyItem[]>(initialKeys)
  const [name, setName] = useState("")
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["contacts:read", "workflows:read"])
  const [loading, setLoading] = useState(false)
  const [newSecretKey, setNewSecretKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const availableScopes = [
    "contacts:read",
    "contacts:write",
    "workflows:read",
    "workflows:trigger",
    "deals:read",
    "deals:write",
  ]

  const handleToggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter(s => s !== scope))
    } else {
      setSelectedScopes([...selectedScopes, scope])
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setNewSecretKey(null)

    const res = await createApiKey({ name, scopes: selectedScopes })
    if (res.success && res.rawSecretKey && res.apiKey) {
      setNewSecretKey(res.rawSecretKey)
      setKeys([{ ...res.apiKey, status: "active" }, ...keys])
      setName("")
    }
    setLoading(false)
  }

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API Key? Any external requests using it will fail.")) return
    const res = await revokeApiKey(id)
    if (res.success) {
      setKeys(keys.map(k => k.id === id ? { ...k, status: "revoked" } : k))
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="bg-bg-primary p-6 rounded-xl border border-border">
        <h3 className="text-lg font-bold text-text-primary mb-1 flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" /> Create Developer API Key
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Generate scoped API keys to connect custom backend integrations, Zapier, or Inngest pipelines.
        </p>

        {newSecretKey && (
          <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-success font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" /> Save your secret API Key! It will not be shown again.
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-bg-secondary p-3 rounded-lg text-xs font-mono break-all border border-border">
                {newSecretKey}
              </code>
              <button
                onClick={() => copyToClipboard(newSecretKey)}
                className="px-4 py-3 bg-primary text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:bg-primary/90"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Key Name</label>
            <input
              type="text"
              placeholder="e.g. Production Webhook Processor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Permissions / Scopes</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableScopes.map((scope) => {
                const active = selectedScopes.includes(scope)
                return (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => handleToggleScope(scope)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border text-left transition-colors ${
                      active
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-bg-secondary border-border text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {scope}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> {loading ? "Generating..." : "Generate API Key"}
          </button>
        </form>
      </div>

      <div className="bg-bg-primary rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h4 className="font-bold text-sm text-text-primary">Active API Keys</h4>
        </div>

        <div className="divide-y divide-border">
          {keys.length === 0 ? (
            <div className="p-6 text-center text-sm text-text-secondary">No API keys created yet.</div>
          ) : (
            keys.map((k) => (
              <div key={k.id} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-text-primary">{k.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      k.status === "active" ? "bg-success/10 text-success" : "bg-error/10 text-error"
                    }`}>
                      {k.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span className="font-mono">{k.keyPrefix}</span>
                    <span>•</span>
                    <span>Scopes: {k.scopes.join(", ")}</span>
                  </div>
                </div>

                {k.status === "active" && (
                  <button
                    onClick={() => handleRevoke(k.id)}
                    className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    title="Revoke Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
