"use client"

import { useState } from "react"
import { Sparkles, X, Copy, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateAiReply } from "@/app/actions/ai"
import { createCampaign, sendCampaign } from "@/app/actions/marketing"

export default function DashboardAICoach({ agencyId }: { agencyId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [content, setContent] = useState("")
  const [sent, setSent] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setSent(false)
    const res = await generateAiReply(
      "marketing",
      "Write a short re-engagement email for contacts that haven't been active in the last 30 days. Keep it friendly and under 100 words."
    )
    if (res.success && res.data) {
      setContent(res.data)
    }
    setLoading(false)
  }

  const handleSendCampaign = async () => {
    if (!content) return
    setSending(true)
    const created = await createCampaign(agencyId, "AI Re-engagement Campaign")
    if (created.success && created.data) {
      await sendCampaign(created.data.id)
      setSent(true)
    }
    setSending(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
  }

  return (
    <>
      {/* Trigger Card */}
      <div className="bg-primary text-white rounded-xl p-6">
        <h3 className="text-sm font-medium opacity-80 mb-2">AI Business Coach</h3>
        <p className="text-sm mb-4 opacity-90">
          Your sales follow-up rate dropped by 15% yesterday. Want me to draft a re-engagement email for your contacts?
        </p>
        <button
          onClick={() => { setOpen(true); handleGenerate() }}
          className="bg-white text-primary text-xs font-semibold px-4 py-2 rounded-lg w-full hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3 h-3" />
          Generate Email
        </button>
      </div>

      {/* Slide-out Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="w-full max-w-lg bg-bg-primary border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">AI Business Coach</h2>
                  <p className="text-xs text-text-secondary">Re-engagement email</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-text-secondary">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm">Generating your email...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Generated Email</p>
                  <textarea
                    className="w-full h-64 p-4 rounded-xl bg-bg-secondary border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Your AI-generated email will appear here..."
                  />
                  {sent && (
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
                      ✓ Campaign sent to all agency contacts successfully!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleGenerate} disabled={loading}>
                <Sparkles className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button variant="outline" size="icon" onClick={handleCopy} disabled={!content || loading}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button className="flex-1" onClick={handleSendCampaign} disabled={!content || loading || sending || sent}>
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {sent ? "Sent!" : "Send Campaign"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
