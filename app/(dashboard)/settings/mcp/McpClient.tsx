"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { addMcpConnection, deleteMcpConnection, testMcpConnection } from "@/app/actions/mcp"
import { Server, Plus, Trash2, Zap, ArrowLeft, ShieldCheck } from "lucide-react"

export default function McpClient({ connections, agencyId }: { connections: any[], agencyId: string }) {
  const [name, setName] = useState("")
  const [serverUrl, setServerUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await addMcpConnection(agencyId, { name, serverUrl, apiKey })
    setName("")
    setServerUrl("")
    setApiKey("")
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      await deleteMcpConnection(id, agencyId)
    }
  }

  const handleTest = async (id: string) => {
    setTestResult({ loading: true, id })
    const res = await testMcpConnection(id, agencyId)
    setTestResult({ loading: false, id, success: res.success, tools: res.tools, error: res.error })
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => window.location.href = '/settings'}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MCP Connections</h1>
          <p className="text-text-secondary">Manage connections to external Model Context Protocol servers.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Connection</CardTitle>
          <CardDescription>Connect to an external MCP server to grant NEXLIN agents new capabilities.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Connection Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Acme Internal Tools" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Server URL</label>
                <Input type="url" value={serverUrl} onChange={e => setServerUrl(e.target.value)} required placeholder="https://mcp.acme.com" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key / Bearer Token (Optional)</label>
              <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Will be encrypted at rest" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : <><Plus className="w-4 h-4 mr-2" /> Add Connection</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connections.map((conn) => (
          <Card key={conn.id} className="relative overflow-hidden group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">{conn.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleTest(conn.id)} title="Test Connection">
                    <Zap className="w-4 h-4 text-amber-500" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(conn.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="font-mono text-xs">{conn.serverUrl}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${conn.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{conn.isActive ? "Active" : "Inactive"}</span>
                {conn.encryptedCredentials && <span className="text-text-secondary ml-auto text-xs flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Authenticated</span>}
              </div>
              {testResult?.id === conn.id && (
                <div className="mt-4 p-3 bg-bg-primary rounded-md text-xs font-mono">
                  {testResult.loading ? "Testing connection..." : (
                    testResult.success ? (
                      <div className="text-green-600 font-semibold">Success! Found {testResult.tools?.length || 0} tools.</div>
                    ) : (
                      <div className="text-red-600">Error: {testResult.error}</div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {connections.length === 0 && (
          <div className="col-span-full py-8 text-center text-text-secondary border border-dashed rounded-lg">
            No MCP connections configured yet.
          </div>
        )}
      </div>
    </div>
  )
}
