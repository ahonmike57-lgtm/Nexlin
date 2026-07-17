"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Link as LinkIcon, DollarSign, Plus, Copy, CheckCircle2 } from "lucide-react"
import { getAffiliates, createAffiliate } from "@/app/actions/affiliates"

export default function AffiliatesClient({ agencyId }: { agencyId: string }) {
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [targetUrl, setTargetUrl] = useState("https://yourdomain.com/signup")

  useEffect(() => {
    loadAffiliates()
  }, [])

  const loadAffiliates = async () => {
    setIsLoading(true)
    const res = await getAffiliates(agencyId)
    if (res.success && res.data) {
      setAffiliates(res.data)
    }
    setIsLoading(false)
  }

  const handleCreate = async () => {
    if (!newName || !newEmail || !targetUrl) return
    setIsCreating(true)
    const res = await createAffiliate(agencyId, newName, newEmail, targetUrl)
    if (res.success) {
      setNewName("")
      setNewEmail("")
      setShowCreate(false)
      loadAffiliates()
    } else {
      alert("Failed to create affiliate")
    }
    setIsCreating(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(text)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Calculate totals
  const totalClicks = affiliates.reduce((sum, aff) => sum + aff.links.reduce((s: number, l: any) => s + l.clicks, 0), 0)
  const totalConversions = affiliates.reduce((sum, aff) => sum + aff.links.reduce((s: number, l: any) => s + l.conversions, 0), 0)
  const pendingPayouts = affiliates.reduce((sum, aff) => sum + aff.payouts.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + p.amount, 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Affiliate Manager</h2>
          <p className="text-text-secondary">Track referrals, clicks, conversions, and commission payouts.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-2" /> Add Affiliate
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Active Affiliates</h3>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">{affiliates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Total Clicks</h3>
              <LinkIcon className="w-4 h-4 text-secondary" />
            </div>
            <div className="text-3xl font-bold">{totalClicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Conversions</h3>
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <div className="text-3xl font-bold">{totalConversions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Pending Payouts</h3>
              <DollarSign className="w-4 h-4 text-warning" />
            </div>
            <div className="text-3xl font-bold">${pendingPayouts.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {showCreate && (
        <Card className="border-primary/50 shadow-sm max-w-2xl">
          <CardHeader>
            <CardTitle>Add New Affiliate</CardTitle>
            <CardDescription>Create an affiliate account and generate their tracking links.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="jane@example.com" type="email" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Target URL</label>
              <Input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} placeholder="https://yourdomain.com/signup" />
              <p className="text-xs text-text-secondary">Where the affiliate link will redirect visitors.</p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isCreating || !newName || !newEmail}>
                {isCreating ? "Creating..." : "Generate Links"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-bg-secondary border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Affiliate</th>
                <th className="px-6 py-4 font-semibold">Primary Link</th>
                <th className="px-6 py-4 font-semibold">Clicks</th>
                <th className="px-6 py-4 font-semibold">Conversions</th>
                <th className="px-6 py-4 font-semibold">Pending Payout</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">Loading affiliates...</td>
                </tr>
              ) : affiliates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">No affiliates found. Add one above.</td>
                </tr>
              ) : (
                affiliates.map((aff) => {
                  const primaryLink = aff.links[0]
                  const url = primaryLink ? `${primaryLink.targetUrl}?ref=${primaryLink.code}` : "N/A"
                  const affPending = aff.payouts.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + p.amount, 0)
                  
                  return (
                    <tr key={aff.id} className="border-b border-border last:border-0 hover:bg-bg-secondary/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-text-primary">{aff.name}</div>
                        <div className="text-xs text-text-secondary">{aff.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {primaryLink ? (
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-bg-secondary px-2 py-1 rounded border border-border">
                              ?ref={primaryLink.code}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-6 h-6 hover:text-primary"
                              onClick={() => copyToClipboard(url)}
                            >
                              {copiedCode === url ? <CheckCircle2 className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                            </Button>
                          </div>
                        ) : "N/A"}
                      </td>
                      <td className="px-6 py-4 font-medium">{primaryLink?.clicks || 0}</td>
                      <td className="px-6 py-4 font-medium">{primaryLink?.conversions || 0}</td>
                      <td className="px-6 py-4 font-medium text-warning">${affPending.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant={aff.status === 'active' ? 'success' : 'secondary'}>{aff.status}</Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
