"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Globe, Link as LinkIcon, CheckCircle2, AlertCircle } from "lucide-react"
import { updateFunnelDomain } from "@/app/actions/domains"

export default function DomainClient({ initialFunnels, agencyId }: { initialFunnels: any[], agencyId: string }) {
  const [funnels, setFunnels] = useState(initialFunnels)
  const [isVerifying, setIsVerifying] = useState<string | null>(null)
  
  const [selectedFunnel, setSelectedFunnel] = useState("")
  const [domain, setDomain] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFunnel || !domain) return
    
    setIsAdding(true)
    const res = await updateFunnelDomain(selectedFunnel, domain)
    if (res.success) {
      setFunnels(funnels.map(f => f.id === selectedFunnel ? { ...f, customDomain: domain } : f))
      setDomain("")
      setSelectedFunnel("")
    }
    setIsAdding(false)
  }
  
  const handleVerify = (funnelId: string) => {
    setIsVerifying(funnelId)
    setTimeout(() => {
      setIsVerifying(null)
      // Mock verification success
      alert("Domain verified successfully!")
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Custom Domains</h2>
        <p className="text-text-secondary">Connect custom domains to your funnels and websites.</p>
      </div>

      <div className="bg-bg-primary border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Add Custom Domain</h2>
        <form onSubmit={handleAddDomain} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Domain</label>
            <div className="relative">
              <Globe className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <Input 
                required
                className="pl-9" 
                placeholder="e.g. www.myagency.com" 
                value={domain}
                onChange={e => setDomain(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Target Funnel</label>
            <select 
              required
              value={selectedFunnel}
              onChange={e => setSelectedFunnel(e.target.value)}
              className="w-full bg-bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 h-10"
            >
              <option value="">Select Funnel...</option>
              {funnels.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={isAdding}>{isAdding ? "Adding..." : "Add Domain"}</Button>
        </form>
      </div>
      
      <div className="bg-bg-primary border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-bg-secondary/50 font-medium">
          Connected Domains
        </div>
        <div className="divide-y divide-border">
          {funnels.filter(f => f.customDomain).length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              <Globe className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No custom domains connected yet.</p>
            </div>
          ) : (
            funnels.filter(f => f.customDomain).map(funnel => (
              <div key={funnel.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{funnel.customDomain}</h3>
                    <p className="text-sm text-text-secondary flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" /> Connected to: {funnel.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">
                    <AlertCircle className="w-3 h-3" /> Action Required
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={() => handleVerify(funnel.id)} disabled={isVerifying === funnel.id}>
                    {isVerifying === funnel.id ? "Verifying..." : "Verify DNS"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-sm">
        <h3 className="font-semibold text-primary flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4" /> DNS Configuration
        </h3>
        <p className="text-text-secondary mb-4">
          To connect your domain, please add the following records to your DNS provider (e.g., GoDaddy, Namecheap, Cloudflare).
        </p>
        
        <div className="bg-bg-primary rounded-lg border border-border p-4 font-mono text-xs overflow-x-auto space-y-2">
          <div className="flex gap-4">
            <span className="w-16 font-semibold">Type:</span>
            <span>CNAME</span>
          </div>
          <div className="flex gap-4">
            <span className="w-16 font-semibold">Name:</span>
            <span>www (or your subdomain)</span>
          </div>
          <div className="flex gap-4">
            <span className="w-16 font-semibold">Value:</span>
            <span>cname.nexlin.app</span>
          </div>
        </div>
      </div>
    </div>
  )
}
