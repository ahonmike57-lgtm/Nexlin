"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Sparkles, Mail, Phone, Clock, DollarSign } from "lucide-react"
import { useState } from "react"
import { generateDealInsights } from "@/app/actions/deals"

interface DealDetailsSheetProps {
  deal: any
  onClose: () => void
}

export default function DealDetailsSheet({ deal, onClose }: DealDetailsSheetProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [insights, setInsights] = useState<{
    winProbability?: number;
    summary?: string;
    nextAction?: string;
  } | null>(null)
  const [error, setError] = useState("")

  const handleGenerateInsights = async () => {
    setIsGenerating(true)
    setError("")
    const res = await generateDealInsights(deal.id)
    if (res.success && res.data) {
      setInsights(res.data)
    } else {
      setError(res.error || "Failed to generate insights.")
    }
    setIsGenerating(false)
  }

  if (!deal) return null

  const contact = deal.contact || {}

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[400px] bg-bg-primary border-l border-border z-50 shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-start bg-bg-secondary/50">
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-1">{deal.title}</h2>
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <span className="flex items-center text-success font-medium">
                <DollarSign className="w-4 h-4 mr-0.5" />
                {deal.value?.toLocaleString()}
              </span>
              <span>•</span>
              <Badge variant="outline" className="text-xs bg-bg-primary">{deal.stage}</Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 text-text-secondary" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Contact Details</h3>
            <div className="bg-bg-secondary p-4 rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {contact.firstName?.charAt(0) || "U"}
                </div>
                <div>
                  <h4 className="font-medium text-text-primary">{contact.firstName} {contact.lastName}</h4>
                  <p className="text-xs text-text-secondary">{contact.company || "No Company"}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{contact.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{contact.phone || "No phone"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Deal Insights */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" /> AI Deal Insights
              </h3>
            </div>

            {!insights ? (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                <h4 className="font-medium text-text-primary mb-2">Unlock AI Intelligence</h4>
                <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                  Our AI will read through the entire unified inbox history for this contact and predict your chances of winning this deal.
                </p>
                <Button 
                  onClick={handleGenerateInsights} 
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? "Analyzing History..." : "Generate Insights"}
                </Button>
                {error && <p className="text-xs text-destructive mt-3">{error}</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-bg-secondary border border-border rounded-xl p-4 text-center">
                    <p className="text-xs text-text-secondary mb-1">Win Probability</p>
                    <div className="text-3xl font-bold text-success flex items-center justify-center">
                      {insights.winProbability}%
                    </div>
                  </div>
                  <div className="bg-bg-secondary border border-border rounded-xl p-4 text-center">
                    <p className="text-xs text-text-secondary mb-1">AI Confidence</p>
                    <div className="text-lg font-bold text-text-primary flex items-center justify-center mt-1">
                      High
                    </div>
                  </div>
                </div>

                <div className="bg-bg-secondary border border-border rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-text-primary mb-2">Relationship Summary</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {insights.summary}
                  </p>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" /> Next Best Action
                  </h4>
                  <p className="text-sm text-text-primary font-medium leading-relaxed">
                    {insights.nextAction}
                  </p>
                </div>
                
                <Button variant="outline" className="w-full text-xs" onClick={handleGenerateInsights} disabled={isGenerating}>
                  {isGenerating ? "Refreshing..." : "Refresh Insights"}
                </Button>
              </div>
            )}
          </div>
          
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border bg-bg-secondary/50 flex gap-3">
          <Button variant="outline" className="flex-1">Mark as Lost</Button>
          <Button className="flex-1 bg-success hover:bg-success/90 text-white">Mark as Won</Button>
        </div>

      </div>
    </>
  )
}
