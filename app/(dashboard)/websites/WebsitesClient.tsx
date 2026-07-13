"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Plus, ArrowUpRight, Globe, MoreVertical, MousePointerClick, Eye, Sparkles } from "lucide-react"

import { useState } from "react"
import { createFunnel } from "@/app/actions/funnels" // Reusing action
import { useRouter } from "next/navigation"

export default function WebsitesClient({ initialWebsites, agencyId }: { initialWebsites: any[], agencyId: string }) {
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const handleCreate = async () => {
    setIsCreating(true)
    const res = await createFunnel(agencyId, "New Website")
    if (res.success && res.data) {
      router.push(`/funnels/${res.data.id}`) // Using funnel builder route for now
    } else {
      setIsCreating(false)
    }
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Websites</h1>
          <p className="text-text-secondary">Build full-featured, multi-page websites with AI.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-primary text-primary"><Sparkles className="w-4 h-4 mr-2" /> Generate with AI</Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            <Plus className="w-4 h-4 mr-2" /> {isCreating ? "Creating..." : "Create Website"}
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Total Site Visitors</h3>
              <Eye className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">124,530</div>
            <p className="text-xs text-success flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +22% this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Avg. Bounce Rate</h3>
              <MousePointerClick className="w-4 h-4 text-warning" />
            </div>
            <div className="text-3xl font-bold">42.8%</div>
            <p className="text-xs text-success flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> -5.4% this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Active Domains</h3>
              <Globe className="w-4 h-4 text-secondary" />
            </div>
            <div className="text-3xl font-bold">5</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 py-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search websites..." 
            className="w-full pl-9 pr-4 py-2 bg-bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <Button variant="outline" className="bg-bg-primary"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialWebsites.map((website) => (
          <Link key={website.id} href={`/funnels/${website.id}`}>
            <Card className="hover:shadow-md transition-shadow group cursor-pointer border border-border">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-text-primary group-hover:text-primary transition-colors">{website.name}</h3>
                    <p className="text-xs text-text-secondary mt-1">{website.subdomain || "No domain connected"}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2">
                    <MoreVertical className="w-4 h-4 text-text-secondary" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 mb-6">
                  <Badge variant={website.status === 'Active' ? 'success' : 'secondary'} className="px-2 py-0">
                    {website.status}
                  </Badge>
                  <span className="text-xs font-medium text-text-secondary">{website.steps?.length || 1} Pages</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* Create New Card */}
        <div onClick={handleCreate} className="h-full border-2 border-dashed border-border bg-bg-secondary/50 hover:bg-primary/5 hover:border-primary/50 transition-colors cursor-pointer group flex flex-col items-center justify-center p-6 min-h-[200px]">
          <div className="w-12 h-12 rounded-full bg-bg-primary border border-border flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-primary/50 group-hover:text-primary transition-all">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">Create New Website</h3>
          <p className="text-sm text-text-secondary text-center mt-2 max-w-[200px]">Start from scratch or use AI to generate</p>
        </div>
      </div>
    </div>
  )
}
