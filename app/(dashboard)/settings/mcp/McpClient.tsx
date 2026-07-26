"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { addMcpConnection, deleteMcpConnection, testMcpConnection } from "@/app/actions/mcp"
import { Server, Plus, Trash2, Zap, ShieldCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function McpClient({ initialConnections }: { initialConnections: any[] }) {
  const [connections, setConnections] = useState(initialConnections)
  const [name, setName] = useState("")
  const [serverUrl, setServerUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !serverUrl) return

    setLoading(true)
    const res = await addMcpConnection({ name, serverUrl, apiKey })
    if (res.success && res.connection) {
      toast.success("MCP Connection added successfully!")
      setConnections([res.connection, ...connections])
      setName("")
      setServerUrl("")
      setApiKey("")
    } else {
      toast.error(res.error || "Failed to add connection")
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    const res = await deleteMcpConnection(id)
    if (res.success) {
      toast.success("MCP connection removed")
      setConnections(connections.filter(c => c.id !== id))
    } else {
      toast.error(res.error || "Failed to delete connection")
    }
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    const res = await testMcpConnection(id)
    if (res.success) {
      toast.success("MCP server connection test succeeded! Tools discovered.")
    } else {
      toast.error(res.error || "MCP connection test failed")
    }
    setTestingId(null)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">MCP Connections (Model Context Protocol)</h2>
        <p className="text-text-secondary">Connect external MCP servers to grant Nexlin AI agents custom tools and capabilities.</p>
      </div>

      <Card className="bg-bg-primary border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" /> Add New MCP Server
          </CardTitle>
          <CardDescription>Enter your MCP server endpoint and authentication secret.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Server Name</label>
                <Input
                  placeholder="e.g. Postgres DB Query Server"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Server Endpoint URL</label>
                <Input
                  placeholder="https://mcp.yourdomain.com/v1"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">API Key / Token (Optional)</label>
              <Input
                type="password"
                placeholder="mcp_secret_••••••••"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-[11px] text-text-secondary">Credentials are encrypted at rest via AES-256-GCM.</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                Add MCP Connection
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-secondary uppercase">Active MCP Connections</h3>
        {connections.length === 0 ? (
          <div className="p-6 text-center border border-border rounded-xl bg-bg-primary text-text-secondary text-xs">
            No MCP connections configured yet.
          </div>
        ) : (
          connections.map((c) => (
            <div key={c.id} className="p-4 rounded-xl border border-border bg-bg-primary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-medium text-sm text-text-primary">{c.name}</h4>
                  <p className="text-xs text-text-secondary font-mono truncate max-w-md">{c.serverUrl}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleTest(c.id)} disabled={testingId === c.id}>
                  {testingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Zap className="w-3.5 h-3.5 mr-1" />}
                  Test Connection
                </Button>
                <Button variant="ghost" size="sm" className="text-error hover:text-error" onClick={() => handleDelete(c.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
