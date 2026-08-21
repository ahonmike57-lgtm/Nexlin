"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  Loader2,
  Mic,
  MicOff,
  Search,
  Users,
  Kanban,
  FileText,
  Workflow,
  Zap,
  Mail,
  Share2,
  Megaphone,
  Star,
  Code2,
  LayoutTemplate,
  Store,
  BarChart3,
  LifeBuoy,
  Mic as VoiceIcon,
  Settings,
  Plus,
  ArrowRight,
  SunMoon,
  PhoneCall,
  Download,
  Flame,
  Globe,
  Bot
} from "lucide-react"
import { generateAiReply } from "@/app/actions/ai"
import { createContact } from "@/app/actions/contacts"
import { toast } from "sonner"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface NavItem {
  title: string
  href: string
  icon: any
  category: "Navigation" | "Action"
  shortcut?: string
  keywords?: string[]
}

const COMMAND_ITEMS: NavItem[] = [
  // Core Navigation
  { title: "Dashboard Overview", href: "/dashboard", icon: BarChart3, category: "Navigation", keywords: ["home", "stats", "metrics"] },
  { title: "Contacts & Leads", href: "/crm/contacts", icon: Users, category: "Navigation", shortcut: "G C", keywords: ["crm", "customers", "people"] },
  { title: "Lead Hygiene & Dedupe", href: "/crm/contacts/dedupe", icon: Flame, category: "Navigation", keywords: ["deduplication", "clean", "merge"] },
  { title: "Deals & Pipeline Kanban", href: "/crm/deals", icon: Kanban, category: "Navigation", shortcut: "G D", keywords: ["sales", "stages", "pipeline"] },
  { title: "Proposals, Quotes & CPQ", href: "/crm/invoices", icon: FileText, category: "Navigation", keywords: ["invoices", "contracts", "signatures"] },
  { title: "AI Sales Roleplay Coach", href: "/crm/roleplay", icon: Bot, category: "Navigation", keywords: ["pitch", "practice", "training"] },
  { title: "Unified Omni-Inbox", href: "/chat", icon: Mail, category: "Navigation", keywords: ["messages", "conversations", "sms", "email", "whatsapp"] },
  { title: "Appointments & Calendar", href: "/calendar", icon: Users, category: "Navigation", keywords: ["schedule", "booking", "meetings"] },
  { title: "Automations & Drip Workflows", href: "/automations", icon: Zap, category: "Navigation", keywords: ["inngest", "triggers", "actions"] },
  { title: "Email Drag & Drop Builder", href: "/marketing/emails/builder", icon: Mail, category: "Navigation", keywords: ["newsletter", "campaigns", "editor"] },
  { title: "Forge AI Website & Funnel Builder", href: "/forge", icon: Sparkles, category: "Navigation", keywords: ["pages", "ai generate", "sites"] },
  { title: "Vibecode Funnel Publisher", href: "/forge/vibecode", icon: Code2, category: "Navigation", keywords: ["code", "landing pages", "fast"] },
  { title: "Funnels & Landing Pages", href: "/funnels", icon: Workflow, category: "Navigation", keywords: ["optin", "sales funnel"] },
  { title: "Forms & Surveys Builder", href: "/forms", icon: FileText, category: "Navigation", keywords: ["lead capture", "questions"] },
  { title: "Social Planner & Scheduler", href: "/social", icon: Share2, category: "Navigation", keywords: ["facebook", "instagram", "linkedin"] },
  { title: "Ads ROI Manager", href: "/ads", icon: Megaphone, category: "Navigation", keywords: ["meta ads", "google ads"] },
  { title: "Reputation & Review Requests", href: "/reputation", icon: Star, category: "Navigation", keywords: ["google reviews", "rating"] },
  { title: "App Marketplace", href: "/marketplace", icon: Store, category: "Navigation", keywords: ["integrations", "tools", "apps"] },
  { title: "Voice Receptionist & Inbound AI", href: "/voice", icon: VoiceIcon, category: "Navigation", keywords: ["telephony", "phone", "agents"] },
  { title: "Missed-Call Text-Back Settings", href: "/settings/missed-call", icon: PhoneCall, category: "Navigation", keywords: ["sms", "auto reply", "phone"] },
  { title: "Billing, Wallets & 0% BYOK", href: "/settings/billing", icon: BarChart3, category: "Navigation", keywords: ["credits", "usage", "stripe"] },
  { title: "Domain & SSL Health Checker", href: "/settings/domains/check", icon: Globe, category: "Navigation", keywords: ["dns", "cname", "ssl"] },
  { title: "System Settings", href: "/settings", icon: Settings, category: "Navigation", keywords: ["agency", "profile", "branding"] },

  // Instant Actions
  { title: "Create New Lead / Contact", href: "/crm/contacts", icon: Plus, category: "Action", keywords: ["add lead", "new person"] },
  { title: "Create CPQ Proposal", href: "/crm/invoices", icon: FileText, category: "Action", keywords: ["new quote", "new invoice"] },
  { title: "Launch Inbound Phone Call Test", href: "/voice/test", icon: PhoneCall, category: "Action", keywords: ["test mic", "call agent"] },
  { title: "Export Leads to CSV", href: "/crm/contacts", icon: Download, category: "Action", keywords: ["download", "backup"] }
]

export function AskAiCommandBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "nav" | "actions" | "ai">("all")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const router = useRouter()

  // ⌘K / Ctrl+K Shortcut Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
        setQuery("")
        setAiResponse(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Filter Command Items
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      if (activeTab === "nav") return COMMAND_ITEMS.filter((i) => i.category === "Navigation")
      if (activeTab === "actions") return COMMAND_ITEMS.filter((i) => i.category === "Action")
      return COMMAND_ITEMS
    }

    const q = query.toLowerCase()
    return COMMAND_ITEMS.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q)
      const matchKeyword = item.keywords?.some((k) => k.toLowerCase().includes(q))
      const matchCategory =
        activeTab === "all" ||
        (activeTab === "nav" && item.category === "Navigation") ||
        (activeTab === "actions" && item.category === "Action")

      return (matchTitle || matchKeyword) && matchCategory
    })
  }, [query, activeTab])

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredItems])

  // Keyboard Arrow Navigation & Enter Execution
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filteredItems[selectedIndex]) {
        executeItem(filteredItems[selectedIndex])
      } else if (query.trim()) {
        handleAskAi()
      }
    }
  }

  const executeItem = (item: NavItem) => {
    setOpen(false)
    router.push(item.href)
    toast.success(`Navigating to ${item.title}`)
  }

  const handleAskAi = async () => {
    if (!query.trim()) return
    setLoading(true)
    setAiResponse(null)

    try {
      const aiRes = await generateAiReply(
        "",
        `You are the Nexlin GHL Copilot. The user typed into the command center: "${query}". Provide a concise, highly actionable response or execute instructions. If creating data, specify clearly what was done.`
      )

      if (aiRes.success && aiRes.data) {
        setAiResponse(aiRes.data)
      } else {
        toast.error("AI assistant was unable to process request.")
      }
    } catch {
      toast.error("Failed to connect to AI engine.")
    } finally {
      setLoading(false)
    }
  }

  const toggleVoice = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRec) {
      toast.error("Speech recognition is not supported in this browser.")
      return
    }

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const rec = new SpeechRec()
    rec.lang = "en-US"
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e: any) => {
      const transcript: string = e.results[0][0].transcript
      setQuery(transcript)
      toast.success(`Voice captured: "${transcript}"`)
    }
    rec.onerror = () => {
      toast.error("Voice recognition error.")
      setListening(false)
    }
    rec.onend = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
    setListening(true)
    toast.info("Listening... speak your command")
  }

  return (
    <>
      {/* Top Bar Quick Trigger Button */}
      <button
        onClick={() => {
          setOpen(true)
          setQuery("")
          setAiResponse(null)
        }}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-bg-secondary/60 hover:bg-bg-secondary text-text-secondary text-xs transition-all hover:border-primary/40 shadow-sm"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search or jump to...</span>
        <kbd className="ml-2 font-mono text-[10px] bg-bg-primary px-1.5 py-0.5 rounded border border-border text-text-secondary">
          ⌘K
        </kbd>
      </button>

      {/* Spotlight Command Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-bg-primary border-border shadow-2xl rounded-2xl">
          {/* Header & Input Field */}
          <div className="p-3 border-b border-border flex items-center gap-2.5 bg-bg-secondary/40">
            <Search className="w-5 h-5 text-primary ml-1 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command, page name, or ask AI anything..."
              className="w-full bg-transparent border-none text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
              autoFocus
            />

            <button
              type="button"
              onClick={toggleVoice}
              className={`p-1.5 rounded-lg border transition-all ${
                listening
                  ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse"
                  : "border-border hover:bg-bg-secondary text-text-secondary"
              }`}
              title="Voice Command"
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleAskAi}
              disabled={loading || !query.trim()}
              className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-white transition-all text-xs flex items-center gap-1 font-medium disabled:opacity-40"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>AI</span>
            </button>
          </div>

          {/* Filter Category Tabs */}
          <div className="px-3 py-2 border-b border-border flex gap-1.5 bg-bg-secondary/20 text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === "all" ? "bg-primary text-white font-medium shadow-sm" : "text-text-secondary hover:bg-bg-secondary"
              }`}
            >
              All ({COMMAND_ITEMS.length})
            </button>
            <button
              onClick={() => setActiveTab("nav")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === "nav" ? "bg-primary text-white font-medium shadow-sm" : "text-text-secondary hover:bg-bg-secondary"
              }`}
            >
              Pages ({COMMAND_ITEMS.filter((i) => i.category === "Navigation").length})
            </button>
            <button
              onClick={() => setActiveTab("actions")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeTab === "actions" ? "bg-primary text-white font-medium shadow-sm" : "text-text-secondary hover:bg-bg-secondary"
              }`}
            >
              Quick Actions
            </button>
          </div>

          {/* AI Response Card (if queried) */}
          {aiResponse && (
            <div className="p-4 m-3 rounded-xl bg-primary/5 border border-primary/20 text-sm space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nexlin AI Assistant Response</span>
              </div>
              <p className="text-text-primary text-xs leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
            </div>
          )}

          {/* Command List Results */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm font-medium text-text-primary">No matching commands or pages found</p>
                <p className="text-xs text-text-secondary">
                  Press <kbd className="font-mono bg-bg-secondary px-1 py-0.5 rounded border border-border">Enter</kbd> to ask Nexlin AI to handle "{query}"
                </p>
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const Icon = item.icon
                const isSelected = idx === selectedIndex
                return (
                  <button
                    key={`${item.title}-${idx}`}
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-text-primary hover:bg-bg-secondary/80 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected ? "bg-primary text-white shadow-sm" : "bg-bg-secondary text-text-secondary"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="text-[11px] text-text-secondary">{item.href}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {item.category}
                      </Badge>
                      {item.shortcut && (
                        <kbd className="text-[10px] font-mono bg-bg-secondary px-1.5 py-0.5 rounded border border-border text-text-secondary">
                          {item.shortcut}
                        </kbd>
                      )}
                      <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? "translate-x-0.5 text-primary" : "opacity-0"}`} />
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer Shortcuts Navigation Bar */}
          <div className="px-4 py-2.5 border-t border-border bg-bg-secondary/40 flex items-center justify-between text-[11px] text-text-secondary">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="font-mono bg-bg-primary px-1 py-0.5 rounded border border-border mr-1">↑</kbd>
                <kbd className="font-mono bg-bg-primary px-1 py-0.5 rounded border border-border mr-1">↓</kbd>
                Navigate
              </span>
              <span>
                <kbd className="font-mono bg-bg-primary px-1 py-0.5 rounded border border-border mr-1">↵</kbd>
                Select
              </span>
              <span>
                <kbd className="font-mono bg-bg-primary px-1 py-0.5 rounded border border-border mr-1">ESC</kbd>
                Close
              </span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <Sparkles className="w-3 h-3" />
              <span className="font-medium">Universal Command Center</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
