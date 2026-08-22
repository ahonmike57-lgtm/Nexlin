"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  MessageCircle,
  Mail,
  MessageSquare,
  Check,
  X,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Inbox as InboxIcon,
  Search,
  MoreHorizontal,
  Send,
  Plus,
  Sparkles,
  User,
  Phone,
  ExternalLink,
  ChevronDown
} from "lucide-react"
import {
  getMessages,
  sendMessage,
  createQuickContactAndConversation,
} from "@/app/actions/chat"
import { saveChannelCredentials } from "@/app/actions/channel-credentials"
import { generateAiReply } from "@/app/actions/ai"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

function ChannelIcon({ channel, size = 16 }: { channel: string; size?: number }) {
  if (channel === "whatsapp") return <MessageCircle size={size} className="text-emerald-500" />
  if (channel === "email") return <Mail size={size} className="text-amber-500" />
  return <MessageSquare size={size} className="text-primary" />
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-200 ${
            i <= current ? "bg-primary w-4" : "bg-border w-1.5"
          }`}
        />
      ))}
    </div>
  )
}

function WhatsAppWizard({
  onClose,
  onConnected
}: {
  onClose: () => void
  onConnected: (phoneNumberId: string, token: string) => void
}) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [phoneNumberId, setPhoneNumberId] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const totalSteps = 4

  function goNext() {
    if (step === 1) {
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
        setStep(2)
      }, 1000)
      return
    }
    setStep((s) => Math.min(s + 1, totalSteps - 1))
  }

  function handleSendCode() {
    if (phone.trim().length < 7) return
    setOtpSent(true)
  }

  return (
    <div className="w-full max-w-lg rounded-2xl overflow-hidden bg-bg-primary border border-border shadow-2xl animate-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-secondary/40">
        <div className="flex items-center gap-2.5">
          <MessageCircle size={20} className="text-emerald-500" />
          <span className="font-bold text-base text-text-primary">Connect WhatsApp Cloud API</span>
        </div>
        <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary">
          <X size={18} />
        </button>
      </div>

      {step > 0 && (
        <div className="px-6 pt-4">
          <StepDots total={totalSteps} current={step} />
        </div>
      )}

      <div className="p-6 space-y-4">
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-xs text-text-secondary">
              Connect your Meta Business WhatsApp number to send and receive WhatsApp messages directly in Nexlin.
            </p>
            <div className="p-4 rounded-xl border border-border bg-bg-secondary/30 space-y-2">
              <span className="text-xs font-bold text-text-primary">Prerequisites:</span>
              <ul className="text-xs text-text-secondary list-disc pl-4 space-y-1">
                <li>Meta Developer Account & App ID</li>
                <li>WhatsApp Business Phone Number ID</li>
                <li>System User Permanent Access Token</li>
              </ul>
            </div>
            <Button onClick={() => setStep(1)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
              Start WhatsApp Setup
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">WhatsApp Phone Number ID</label>
              <Input
                placeholder="e.g. 104829104829104"
                value={phoneNumberId}
                onChange={e => setPhoneNumberId(e.target.value)}
                className="text-xs font-mono bg-bg-secondary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Permanent Access Token</label>
              <Input
                type="password"
                placeholder="EAAG..."
                value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
                className="text-xs font-mono bg-bg-secondary/50"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} className="flex-1 text-xs">Cancel</Button>
              <Button
                onClick={() => {
                  if (phoneNumberId && accessToken) {
                    onConnected(phoneNumberId, accessToken)
                  } else {
                    toast.error("Please fill in both Phone ID and Token")
                  }
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                Save & Connect
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmailWizard({
  onClose,
  onConnected
}: {
  onClose: () => void
  onConnected: (provider: string) => void
}) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleConnect = (provider: string) => {
    setSelectedProvider(provider)
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onConnected(provider)
    }, 1200)
  }

  return (
    <div className="w-full max-w-md rounded-2xl overflow-hidden bg-bg-primary border border-border shadow-2xl animate-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-secondary/40">
        <div className="flex items-center gap-2.5">
          <Mail size={20} className="text-amber-500" />
          <span className="font-bold text-base text-text-primary">Connect Email Channel</span>
        </div>
        <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary">
          <X size={18} />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-xs text-text-secondary">
          Choose your email provider to send and receive support & sales emails in the Omnichannel inbox.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleConnect("google")}
            disabled={loading}
            className="w-full p-3.5 rounded-xl border border-border bg-bg-secondary/40 hover:border-primary flex items-center justify-between transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">G</div>
              <div>
                <p className="text-xs font-bold text-text-primary">Google Workspace / Gmail</p>
                <p className="text-[10px] text-text-secondary">Connect via OAuth 2.0</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </button>

          <button
            onClick={() => handleConnect("microsoft")}
            disabled={loading}
            className="w-full p-3.5 rounded-xl border border-border bg-bg-secondary/40 hover:border-primary flex items-center justify-between transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-xs">M</div>
              <div>
                <p className="text-xs font-bold text-text-primary">Microsoft 365 / Outlook</p>
                <p className="text-[10px] text-text-secondary">Connect via Azure AD OAuth</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ChatClient({ initialConversations }: { initialConversations: any[] }) {
  const [conversations, setConversations] = useState<any[]>(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(initialConversations[0]?.id || null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newChannel, setNewChannel] = useState("sms")
  const [isCreating, setIsCreating] = useState(false)
  const [outboundChannel, setOutboundChannel] = useState<"sms" | "whatsapp" | "email">("sms")

  const bottomRef = useRef<HTMLDivElement>(null)

  const [channels, setChannels] = useState({
    sms: { connected: true, label: "+1 (214) 555-0142" },
    whatsapp: { connected: initialConversations.some(c => c.channel === "whatsapp"), label: null as string | null },
    email: { connected: initialConversations.some(c => c.channel === "email"), label: null as string | null },
  })

  const selected = conversations.find(c => c.id === selectedId) || conversations[0] || null

  useEffect(() => {
    if (!selected?.id) return
    getMessages(selected.id).then(res => {
      if (res.success) setMessages(res.data || [])
    })
    if (selected.channel) {
      setOutboundChannel(selected.channel as any)
    }
  }, [selected?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    if (!newMessage.trim() || !selected) return
    const textToSend = newMessage.trim()
    setNewMessage("")

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      conversationId: selected.id,
      content: textToSend,
      isOutbound: true,
      status: "sending",
      createdAt: new Date().toISOString(),
    }

    setMessages(prev => [...prev, optimisticMsg])
    setIsSending(true)

    const res = await sendMessage(selected.id, textToSend)
    if (res.success && res.data) {
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? res.data : m))
    } else {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      setNewMessage(textToSend)
      toast.error("error" in res ? res.error : "Failed to send message")
    }
    setIsSending(false)
  }

  async function handleAiReply() {
    if (!selected) return
    setIsAiLoading(true)
    const res = await generateAiReply("chat", selected.id)
    if (res.success && res.data) {
      setNewMessage(res.data)
      toast.success("AI Copilot drafted a reply!")
    } else {
      toast.error("AI reply failed")
    }
    setIsAiLoading(false)
  }

  async function handleWhatsAppConnected(phoneNumberId: string, token: string) {
    await saveChannelCredentials({ whatsappPhoneNumberId: phoneNumberId, whatsappAccessToken: token })
    setChannels(c => ({ ...c, whatsapp: { connected: true, label: "+1 (214) 555-0198" } }))
    setActiveModal(null)
    toast.success("WhatsApp Business connected!")
  }

  async function handleEmailConnected(provider: string) {
    const label = provider === "google" ? "support@youragency.com" : "sales@youragency.onmicrosoft.com"
    await saveChannelCredentials({ emailAddress: label, smtpHost: "smtp.gmail.com", smtpPort: "587", smtpUser: label })
    setChannels(c => ({ ...c, email: { connected: true, label } }))
    setActiveModal(null)
    toast.success("Email channel connected!")
  }

  async function handleNewChat(e: React.FormEvent) {
    e.preventDefault()
    if (!newPhone.trim()) return
    setIsCreating(true)
    const res = await createQuickContactAndConversation(newName || "New Lead", newPhone, newChannel)
    if (res.success && res.data) {
      const conv = res.data
      setConversations(prev => [conv, ...prev.filter(c => c.id !== conv.id)])
      setSelectedId(conv.id)
      setIsNewChatOpen(false)
      setNewName("")
      setNewPhone("")
      toast.success(`${newChannel.toUpperCase()} conversation started`)
    } else {
      toast.error("error" in res ? res.error : "Failed to start conversation")
    }
    setIsCreating(false)
  }

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true
    const name = `${c.contact?.firstName || ""} ${c.contact?.lastName || ""}`.toLowerCase()
    return name.includes(searchQuery.toLowerCase()) || (c.contact?.phone || "").includes(searchQuery)
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <MessageSquare className="w-8 h-8 text-primary" /> Conversations & Omnichannel Inbox
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Unified multi-channel messaging thread across SMS, WhatsApp, and Email.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsNewChatOpen(true)} className="bg-primary text-white" size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> New Conversation
          </Button>
        </div>
      </div>

      {/* Main 3-Column Studio */}
      <div className="h-[calc(100vh-12rem)] min-h-[500px] rounded-2xl border border-border bg-bg-primary overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12">
        {/* Left: Channels Rail (2 cols on md+) */}
        <div className="md:col-span-3 border-r border-border bg-bg-secondary/30 flex flex-col p-3 gap-2 overflow-y-auto">
          <span className="text-[10px] font-bold tracking-wider uppercase text-text-secondary px-2 pt-1">
            Connected Channels
          </span>

          {/* SMS Channel */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-bg-primary shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary leading-tight">Text / SMS</p>
                <p className="text-[10px] font-mono text-text-secondary mt-0.5">{channels.sms.label}</p>
              </div>
            </div>
            <Check className="w-3.5 h-3.5 text-primary" />
          </div>

          {/* WhatsApp Channel */}
          <button
            onClick={() => !channels.whatsapp.connected && setActiveModal("whatsapp")}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
              channels.whatsapp.connected
                ? "bg-bg-primary border-border shadow-sm"
                : "border-dashed border-border hover:border-emerald-500/50 hover:bg-emerald-500/5"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary leading-tight">WhatsApp</p>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  {channels.whatsapp.connected ? channels.whatsapp.label || "Connected" : "Connect Meta API"}
                </p>
              </div>
            </div>
            {channels.whatsapp.connected ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />
            )}
          </button>

          {/* Email Channel */}
          <button
            onClick={() => !channels.email.connected && setActiveModal("email")}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
              channels.email.connected
                ? "bg-bg-primary border-border shadow-sm"
                : "border-dashed border-border hover:border-amber-500/50 hover:bg-amber-500/5"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary leading-tight">Email</p>
                <p className="text-[10px] text-text-secondary mt-0.5 truncate max-w-[120px]">
                  {channels.email.connected ? channels.email.label || "Connected" : "Connect Inbox"}
                </p>
              </div>
            </div>
            {channels.email.connected ? (
              <Check className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />
            )}
          </button>
        </div>

        {/* Middle: Conversation List (4 cols) */}
        <div className="md:col-span-4 border-r border-border bg-bg-primary flex flex-col overflow-hidden">
          {/* Search Header */}
          <div className="p-3 border-b border-border bg-bg-secondary/20">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-8 h-8 text-xs bg-bg-primary"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                <InboxIcon className="w-8 h-8 text-border mx-auto mb-2" />
                <p className="text-xs font-semibold">No conversations yet</p>
                <button
                  onClick={() => setIsNewChatOpen(true)}
                  className="mt-2 text-xs text-primary hover:underline font-bold"
                >
                  + Start a chat
                </button>
              </div>
            ) : (
              filteredConversations.map(c => {
                const name = c.contact
                  ? `${c.contact.firstName || ""} ${c.contact.lastName || ""}`.trim() || "Contact"
                  : "Contact"
                const preview = c.messages?.[0]?.content || "No messages yet"
                const time = format(new Date(c.updatedAt), "h:mm a")
                const isActive = c.id === selectedId

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 ${
                      isActive
                        ? "bg-primary/10 border-l-4 border-l-primary"
                        : "hover:bg-bg-secondary/40"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <ChannelIcon channel={c.channel} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-text-primary truncate">{name}</span>
                        <span className="text-[10px] text-text-secondary shrink-0">{time}</span>
                      </div>
                      <p className="text-xs text-text-secondary truncate mt-0.5">{preview}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right: Message Thread & Composer (5 cols) */}
        <div className="md:col-span-5 flex flex-col bg-bg-primary overflow-hidden">
          {selected ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-border bg-bg-secondary/20 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {(selected.contact?.firstName || "C").substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">
                      {selected.contact
                        ? `${selected.contact.firstName || ""} ${selected.contact.lastName || ""}`.trim() || "Contact"
                        : "Contact"}
                    </h3>
                    <p className="text-[10px] font-mono text-text-secondary">
                      {selected.contact?.phone || selected.contact?.email || selected.channel.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/crm/contacts" className="text-text-secondary hover:text-primary p-1.5 rounded-lg border border-border bg-bg-primary text-xs flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> CRM
                  </Link>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAiReply}
                    disabled={isAiLoading}
                    className="h-7 text-xs text-primary border-primary/30 hover:bg-primary/10"
                  >
                    {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    AI Reply
                  </Button>
                </div>
              </div>

              {/* Message Timeline */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-bg-secondary/10">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary">
                    <MessageSquare className="w-8 h-8 text-border mb-2" />
                    <p className="text-xs">No message history yet. Send a message below!</p>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={m.id || i} className={`flex ${m.isOutbound ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[78%] px-4 py-2.5 rounded-2xl shadow-sm text-xs leading-relaxed ${
                          m.isOutbound
                            ? "bg-primary text-white rounded-br-none"
                            : "bg-bg-secondary/80 text-text-primary border border-border rounded-bl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${m.isOutbound ? "text-white/70" : "text-text-secondary"}`}>
                          {format(new Date(m.createdAt), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              <div className="p-3 border-t border-border bg-bg-primary space-y-2 flex-shrink-0">
                {/* Channel Switcher */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-text-secondary uppercase">Send Via:</span>
                    {(["sms", "whatsapp", "email"] as const).map(ch => (
                      <button
                        key={ch}
                        onClick={() => setOutboundChannel(ch)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize flex items-center gap-1 transition-colors ${
                          outboundChannel === ch
                            ? "bg-primary text-white"
                            : "bg-bg-secondary text-text-secondary hover:bg-border"
                        }`}
                      >
                        <ChannelIcon channel={ch} size={12} />
                        {ch.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <textarea
                    rows={2}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder={`Type message via ${outboundChannel.toUpperCase()}... (Press Enter to send)`}
                    className="flex-1 p-2.5 rounded-xl border border-border bg-bg-secondary/30 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={isSending || !newMessage.trim()}
                    className="h-10 w-10 bg-primary text-white rounded-xl shrink-0"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-text-secondary">
              <InboxIcon className="w-10 h-10 text-border mb-2" />
              <p className="text-xs font-semibold">Select a conversation to view message history</p>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/60 backdrop-blur-xs" onClick={() => setIsNewChatOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-bg-primary border border-border shadow-2xl animate-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-secondary/40">
              <span className="font-bold text-sm text-text-primary">Start New Conversation</span>
              <button onClick={() => setIsNewChatOpen(false)} className="text-text-secondary hover:text-text-primary"><X size={16} /></button>
            </div>
            <form onSubmit={handleNewChat} className="p-5 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">Contact Name</label>
                <Input
                  placeholder="e.g. Sarah Connor"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="text-xs bg-bg-secondary/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">Phone Number or Email *</label>
                <Input
                  placeholder="+15551234567 or user@example.com"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  required
                  className="text-xs font-mono bg-bg-secondary/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">Channel</label>
                <select
                  value={newChannel}
                  onChange={e => setNewChannel(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-bg-primary px-3 text-xs text-text-primary"
                >
                  <option value="sms">💬 Text / SMS</option>
                  <option value="whatsapp">📱 WhatsApp</option>
                  <option value="email">✉️ Email</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsNewChatOpen(false)} className="flex-1 text-xs">Cancel</Button>
                <Button type="submit" size="sm" disabled={isCreating || !newPhone.trim()} className="flex-1 bg-primary text-white text-xs">
                  {isCreating ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                  Start Chat
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {activeModal === "whatsapp" && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)}>
          <div onClick={e => e.stopPropagation()}>
            <WhatsAppWizard onClose={() => setActiveModal(null)} onConnected={handleWhatsAppConnected} />
          </div>
        </div>
      )}

      {/* Email Modal */}
      {activeModal === "email" && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)}>
          <div onClick={e => e.stopPropagation()}>
            <EmailWizard onClose={() => setActiveModal(null)} onConnected={handleEmailConnected} />
          </div>
        </div>
      )}
    </div>
  )
}
