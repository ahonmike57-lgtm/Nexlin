"use client"

import { useState, useRef } from "react"
import { generateAiReply } from "@/app/actions/ai"
import { generateRoleplayScorecard, RoleplayScorecard } from "@/app/actions/roleplay"
import { toast } from "sonner"
import { Bot, Send, Loader2, RefreshCcw, Award, Trophy, CheckCircle2, Target, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

type Persona = {
  id: string
  name: string
  title: string
  avatar: string
  description: string
  systemPrompt: string
}

const PERSONAS: Persona[] = [
  {
    id: "cfo",
    name: "Margaret Chen",
    title: "Skeptical CFO",
    avatar: "MC",
    description: "Laser-focused on ROI, data, and cost justification. Questions every assumption.",
    systemPrompt: `You are Margaret Chen, a skeptical CFO at a 200-person B2B SaaS company. You are evaluating a vendor pitch.
Your personality:
- You demand hard numbers and proven ROI before approving any spend
- You challenge vague claims ("how exactly does that translate to revenue?")
- You're concerned about implementation costs, training time, and hidden fees
- You reference your current systems and ask why they're not good enough
- You ask about TCO, payback period, and integration complexity
- You're polite but firm — you've heard a thousand pitches
Respond in 2-4 sentences, staying in character. Ask sharp follow-up questions.`,
  },
  {
    id: "founder",
    name: "Jake Rivera",
    title: "Eager Startup Founder",
    avatar: "JR",
    description: "Fast-moving and excited, but price-sensitive. Wants everything yesterday.",
    systemPrompt: `You are Jake Rivera, co-founder of a 12-person Series A startup. You're evaluating a CRM/marketing tool.
Your personality:
- You're enthusiastic and move fast — love the idea of automation
- You're strapped for budget but willing to pay for real value
- You ask about how fast onboarding is and what the first week looks like
- You want to know if it integrates with Slack, Stripe, and your existing stack
- You're worried about vendor lock-in and want to know about cancellation terms
- You often say things like "sick", "love that", "wait — so this does X too?"
Respond in 2-4 sentences, staying in character. Ask excited but pointed questions.`,
  },
  {
    id: "enterprise",
    name: "David Okonkwo",
    title: "Enterprise IT Director",
    avatar: "DO",
    description: "Security-conscious, compliance-driven. Needs approvals at every step.",
    systemPrompt: `You are David Okonkwo, IT Director at a 2,000-person enterprise company in financial services.
Your personality:
- Security, compliance (SOC 2, GDPR, ISO 27001), and data residency are your top concerns
- You need SSO (SAML/OIDC), role-based access control, and audit logs
- You ask about penetration testing, data encryption at rest and in transit, and vendor security reviews
- You worry about procurement timelines, legal review, and multi-year contracts
- You need to see a security questionnaire before moving forward
- You're methodical and formal in your communication style
Respond in 2-4 sentences, staying in character. Ask compliance and security-focused questions.`,
  },
]

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function RoleplayPage() {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  // Scorecard state
  const [grading, setGrading] = useState(false)
  const [scorecard, setScorecard] = useState<RoleplayScorecard | null>(null)

  const startSession = () => {
    setMessages([
      {
        role: "assistant",
        content: `Hi, I'm ${selectedPersona.name}. I have about 20 minutes for this call. What problem does your product solve and why should I care?`,
      },
    ])
    setStarted(true)
    setScorecard(null)
  }

  const resetSession = () => {
    setMessages([])
    setStarted(false)
    setInput("")
    setScorecard(null)
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: "user", content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const conversationHistory = newMessages
        .map((m) => `${m.role === "user" ? "Sales Rep" : selectedPersona.name}: ${m.content}`)
        .join("\n\n")

      const res = await generateAiReply(
        selectedPersona.systemPrompt,
        `This is an ongoing sales conversation. The sales rep just said something to you.

Full conversation so far:
${conversationHistory}

Respond as ${selectedPersona.name} (${selectedPersona.title}). Be realistic, challenging, and stay fully in character. 2-4 sentences maximum.`
      )

      if (res.success && res.data) {
        const reply = res.data.replace(/```/g, "").trim()
        setMessages((prev) => [...prev, { role: "assistant", content: reply }])
        setTimeout(() => {
          chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" })
        }, 100)
      } else {
        toast.error("AI response failed")
      }
    } catch {
      toast.error("Failed to get AI response")
    }
    setLoading(false)
  }

  const handleGradePitch = async () => {
    if (messages.filter(m => m.role === "user").length === 0) {
      toast.error("Please practice at least one pitch exchange before grading.")
      return
    }

    setGrading(true)
    const res = await generateRoleplayScorecard(selectedPersona.title, messages)
    setGrading(false)

    if (res.success && res.scorecard) {
      setScorecard(res.scorecard)
      toast.success("Executive Scorecard generated!")
    } else {
      toast.error(res.error || "Failed to grade pitch")
    }
  }

  const userMessageCount = messages.filter(m => m.role === "user").length

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-9rem)] flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            AI Sales Roleplay & Pitch Coach
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Spar against realistic AI buyer personas with instant objective pitch scorecards
          </p>
        </div>
        {started && (
          <div className="flex items-center gap-2">
            {userMessageCount >= 1 && (
              <button
                onClick={handleGradePitch}
                disabled={grading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {grading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                {grading ? "Analyzing…" : "End Call & Grade Pitch"}
              </button>
            )}
            <button
              onClick={resetSession}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-error transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-error/50"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              New Session
            </button>
          </div>
        )}
      </div>

      {!started ? (
        /* Persona Selector Screen */
        <div className="flex-1 flex flex-col items-center justify-center gap-8 bg-bg-primary border border-border rounded-2xl p-8 text-center min-h-0">
          <div className="max-w-md space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">Choose Your Sparring Persona</h2>
            <p className="text-sm text-text-secondary">
              Select a realistic decision maker persona to test your pitch, handle tough objections, and receive an AI evaluation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl text-left">
            {PERSONAS.map((p) => {
              const isSelected = selectedPersona.id === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPersona(p)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/30"
                      : "border-border bg-bg-secondary/40 hover:border-primary/40 hover:bg-bg-secondary"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center">
                      {p.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-text-primary">{p.name}</p>
                      <p className="text-xs text-text-secondary">{p.title}</p>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{p.description}</p>
                </div>
              )
            })}
          </div>

          <button
            onClick={startSession}
            className="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg flex items-center gap-2"
          >
            Start Call with {selectedPersona.name}
          </button>
        </div>
      ) : (
        /* Active Roleplay Screen */
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="flex items-center gap-3 px-4 py-3 bg-bg-primary border border-border rounded-xl flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center">
              {selectedPersona.avatar}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{selectedPersona.name}</p>
              <p className="text-xs text-text-secondary">{selectedPersona.title}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-success font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              In Session ({userMessageCount} pitches made)
            </div>
          </div>

          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto space-y-4 p-4 bg-bg-primary border border-border rounded-xl min-h-0"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    msg.role === "assistant"
                      ? "bg-primary/20 text-primary"
                      : "bg-bg-secondary text-text-secondary border border-border"
                  }`}
                >
                  {msg.role === "assistant" ? selectedPersona.avatar : "You"}
                </div>
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-bg-secondary text-text-primary rounded-tl-none"
                      : "bg-primary text-white rounded-tr-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {selectedPersona.avatar}
                </div>
                <div className="bg-bg-secondary rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSend() }}
            className="flex gap-3 flex-shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Respond to ${selectedPersona.name}...`}
              className="flex-1 px-4 py-3 bg-bg-primary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-3 rounded-xl bg-primary text-white disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      )}

      {/* AI Scorecard Modal */}
      {scorecard && (
        <Dialog open={!!scorecard} onOpenChange={() => setScorecard(null)}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-500" />
                  AI Executive Pitch Scorecard
                </DialogTitle>
                <span className="text-2xl font-black px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  {scorecard.grade}
                </span>
              </div>
              <DialogDescription className="text-xs">
                Performance audit for call with {selectedPersona.name} ({selectedPersona.title})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-2 text-sm">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-bg-secondary p-3 rounded-xl border border-border">
                  <p className="text-xs text-text-secondary">Objection Handling</p>
                  <p className="text-xl font-bold mt-1 text-primary">{scorecard.objectionScore}/100</p>
                </div>
                <div className="bg-bg-secondary p-3 rounded-xl border border-border">
                  <p className="text-xs text-text-secondary">Value Proposition</p>
                  <p className="text-xl font-bold mt-1 text-emerald-500">{scorecard.valuePropScore}/100</p>
                </div>
                <div className="bg-bg-secondary p-3 rounded-xl border border-border">
                  <p className="text-xs text-text-secondary">Closing Strategy</p>
                  <p className="text-xl font-bold mt-1 text-amber-500">{scorecard.closingScore}/100</p>
                </div>
              </div>

              <div className="bg-bg-secondary p-4 rounded-xl border border-border space-y-1.5">
                <p className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Executive Coach Assessment
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {scorecard.executiveSummary}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Key Strengths
                </p>
                <ul className="space-y-1.5">
                  {scorecard.keyStrengths?.map((s, idx) => (
                    <li key={idx} className="text-xs text-text-secondary flex items-start gap-2 bg-success/5 border border-success/20 p-2.5 rounded-lg">
                      <span className="text-success font-bold">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-primary" /> 3 Adjustments to Win the Deal
                </p>
                <ul className="space-y-1.5">
                  {scorecard.actionableTips?.map((tip, idx) => (
                    <li key={idx} className="text-xs text-text-primary flex items-start gap-2 bg-primary/5 border border-primary/20 p-2.5 rounded-lg">
                      <span className="text-primary font-bold">{idx + 1}.</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
