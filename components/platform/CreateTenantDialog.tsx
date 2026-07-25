"use client"

import { useState } from "react"
import { createTenant } from "@/app/actions/tenants"
import { toast } from "sonner"
import { Building, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function CreateTenantDialog({ isOwner }: { isOwner: boolean }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [planTier, setPlanTier] = useState("pro")
  const [ownerName, setOwnerName] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isOwner) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await createTenant({
      name,
      subdomain,
      planTier,
      ownerName,
      ownerEmail,
    })

    if (res.success) {
      toast.success("New tenant created successfully!")
      setOpen(false)
      setName("")
      setSubdomain("")
      setOwnerName("")
      setOwnerEmail("")
    } else {
      toast.error(res.error || "Failed to create tenant")
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] bg-bg-primary text-text-primary border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" /> Add New Tenant Agency
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Agency Name</label>
            <Input
              placeholder="e.g. Acme Marketing Agency"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!subdomain) {
                  setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"))
                }
              }}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Subdomain Prefix</label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="acme"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                required
              />
              <span className="text-xs font-mono text-text-secondary">.nexlin.com</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Plan Tier</label>
            <select
              value={planTier}
              onChange={(e) => setPlanTier(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="basic">Basic Tier</option>
              <option value="pro">Pro Tier ($297/mo)</option>
              <option value="enterprise">Enterprise Tier ($497/mo)</option>
            </select>
          </div>

          <div className="border-t border-border pt-3 space-y-3">
            <div className="text-xs font-semibold text-text-secondary uppercase">Initial Agency Owner</div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium">Owner Full Name</label>
              <Input
                placeholder="John Doe"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Owner Email</label>
              <Input
                type="email"
                placeholder="john@acme.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Create Tenant Agency
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
