"use client"

import { useState, useEffect, useRef } from "react"
import {
  MessageCircle, Mail, MessageSquare, Check, X, Loader2,
  ChevronRight, ArrowLeft, ShieldCheck, Inbox as InboxIcon,
  Search, MoreHorizontal, Send, Plus, Sparkles
} from "lucide-react"
import { getMessages, sendMessage, createConversation, createQuickContactAndConversation, resolveMetaWhatsappError } from "@/app/actions/chat"
import { saveChannelCredentials, getChannelCredentials } from "@/app/actions/channel-credentials"
import { generateAiReply } from "@/app/actions/ai"
import { toast } from "sonner"

const PALETTE = {
  base: '#0B0E1A',
  panel: '#12172A',
  elevated: '#1B2138',
  border: '#262D4A',
  blue: '#1A3CFF',
  gold: '#F5A623',
  whatsapp: '#25D366',
  google: '#4285F4',
  microsoft: '#00A4EF',
  textPrimary: '#F2F4FA',
  textSecondary: '#8B93B0',
  textTertiary: '#5A6180',
}

function ChannelIcon({ channel, size = 16 }: { channel: string; size?: number }) {
  if (channel === 'whatsapp') return <MessageCircle size={size} style={{ color: PALETTE.whatsapp }} />
  if (channel === 'email') return <Mail size={size} style={{ color: PALETTE.google }} />
  return <MessageSquare size={size} style={{ color: PALETTE.blue }} />
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: i === current ? 18 : 6,
            height: 6,
            borderRadius: 9999,
            backgroundColor: i <= current ? PALETTE.whatsapp : PALETTE.border,
            transition: 'all 0.2s ease',
            display: 'inline-block',
          }}
        />
      ))}
    </div>
  )
}

function WhatsAppWizard({ onClose, onConnected }: { onClose: () => void; onConnected: (phoneNumberId: string, token: string) => void }) {
  const [step, setStep] = useState(0)
  const [flow, setFlow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [portfolio, setPortfolio] = useState('')
  const [waba, setWaba] = useState('')
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const totalSteps = 6

  function goNext() {
    if (step === 1) {
      setLoading(true)
      setTimeout(() => { setLoading(false); setStep(2) }, 1100)
      return
    }
    setStep((s) => Math.min(s + 1, totalSteps - 1))
  }

  function handleSendCode() {
    if (phone.trim().length < 7) return
    setOtpSent(true)
  }

  return (
    <div className="modal-enter w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: PALETTE.panel, border: `1px solid ${PALETTE.border}` }}>
      <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
        <div className="flex items-center gap-2.5">
          <MessageCircle size={20} style={{ color: PALETTE.whatsapp }} />
          <span className="font-semibold text-base" style={{ color: PALETTE.textPrimary }}>Connect WhatsApp Business</span>
        </div>
        <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg" style={{ color: PALETTE.textSecondary }}>
          <X size={18} />
        </button>
      </div>

      {step > 0 && (
        <div className="px-6 pt-4">
          <StepDots total={totalSteps} current={step} />
        </div>
      )}

      <div className="px-6 py-6 min-h-[280px] flex flex-col">
        {step === 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm mb-1" style={{ color: PALETTE.textSecondary }}>How do you want to bring WhatsApp in?</p>
            {[
              { id: 'connect', label: 'Connect an existing WhatsApp Business Account', sub: 'Already set up on Meta — link it here.' },
              { id: 'create', label: 'Create a new WhatsApp Business Account', sub: 'Start fresh with a new business number.' },
              { id: 'migrate', label: 'Migrate a number from the WhatsApp Business app', sub: 'Bring your existing conversations into NEXLIN.' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => { setFlow(opt.id); setStep(1) }}
                className="text-left px-4 py-3.5 rounded-xl transition-colors"
                style={{ backgroundColor: PALETTE.elevated, border: `1px solid ${PALETTE.border}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm" style={{ color: PALETTE.textPrimary }}>{opt.label}</span>
                  <ChevronRight size={16} style={{ color: PALETTE.textTertiary }} />
                </div>
                <p className="text-xs mt-1" style={{ color: PALETTE.textTertiary }}>{opt.sub}</p>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            {loading ? (
              <>
                <Loader2 size={28} className="animate-spin" style={{ color: '#1877F2' }} />
                <p className="text-sm" style={{ color: PALETTE.textSecondary }}>Redirecting to Meta...</p>
              </>
            ) : (
              <>
                <p className="text-sm max-w-xs" style={{ color: PALETTE.textSecondary }}>
                  You'll log in and accept Meta's terms for the WhatsApp Business Platform. This opens in a secure Meta window.
                </p>
                <button
                  onClick={goNext}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-lg font-medium text-sm"
                  style={{ backgroundColor: '#1877F2', color: '#FFFFFF' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Continue with Facebook
                </button>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium block mb-2" style={{ color: PALETTE.textSecondary }}>Meta Business Portfolio</label>
              <div className="flex flex-col gap-2">
                {['Pixelis Lab Dealership Partners', '+ Create new Business Portfolio'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPortfolio(p)}
                    className="text-left px-4 py-2.5 rounded-lg text-sm"
                    style={{
                      backgroundColor: portfolio === p ? 'rgba(26,60,255,0.12)' : PALETTE.elevated,
                      border: portfolio === p ? `1px solid ${PALETTE.blue}` : `1px solid ${PALETTE.border}`,
                      color: PALETTE.textPrimary,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {portfolio && (
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: PALETTE.textSecondary }}>WhatsApp Business Account</label>
                <div className="flex flex-col gap-2">
                  {['Rodriguez Auto Sales — WABA', '+ Create new WhatsApp Business Account'].map((w) => (
                    <button
                      key={w}
                      onClick={() => setWaba(w)}
                      className="text-left px-4 py-2.5 rounded-lg text-sm"
                      style={{
                        backgroundColor: waba === w ? 'rgba(26,60,255,0.12)' : PALETTE.elevated,
                        border: waba === w ? `1px solid ${PALETTE.blue}` : `1px solid ${PALETTE.border}`,
                        color: PALETTE.textPrimary,
                      }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium" style={{ color: PALETTE.textSecondary }}>Business phone number</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (214) 555-0142"
                className="flex-1 px-4 py-2.5 rounded-lg outline-none font-mono text-sm"
                style={{ backgroundColor: PALETTE.elevated, border: `1px solid ${PALETTE.border}`, color: PALETTE.textPrimary }}
              />
              <button
                onClick={handleSendCode}
                disabled={phone.trim().length < 7}
                className="px-4 py-2.5 rounded-lg font-medium text-sm disabled:opacity-40"
                style={{ backgroundColor: PALETTE.elevated, border: `1px solid ${PALETTE.border}`, color: PALETTE.textPrimary }}
              >
                Send code
              </button>
            </div>
            {otpSent && (
              <div className="mt-2">
                <label className="text-xs font-medium block mb-2" style={{ color: PALETTE.textSecondary }}>
                  Enter the 6-digit code sent to {phone}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-32 px-4 py-2.5 rounded-lg outline-none font-mono text-lg tracking-widest text-center"
                  style={{ backgroundColor: PALETTE.elevated, border: `1px solid ${PALETTE.border}`, color: PALETTE.textPrimary }}
                />
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium block mb-2" style={{ color: PALETTE.textSecondary }}>WhatsApp Business display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Rodriguez Auto Sales"
                className="w-full px-4 py-2.5 rounded-lg outline-none text-sm"
                style={{ backgroundColor: PALETTE.elevated, border: `1px solid ${PALETTE.border}`, color: PALETTE.textPrimary }}
              />
              <p className="text-xs mt-2" style={{ color: PALETTE.textTertiary }}>
                Subject to review by Meta — approval usually lands within a few hours.
              </p>
            </div>
            <div>
              <label className="text-xs font-medium block mb-2" style={{ color: PALETTE.textSecondary }}>Meta Phone Number ID</label>
              <input
                type="text"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="109283746501928"
                className="w-full px-4 py-2.5 rounded-lg outline-none font-mono text-sm"
                style={{ backgroundColor: PALETTE.elevated, border: `1px solid ${PALETTE.border}`, color: PALETTE.textPrimary }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-2" style={{ color: PALETTE.textSecondary }}>Meta Permanent Access Token</label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAG..."
                className="w-full px-4 py-2.5 rounded-lg outline-none font-mono text-sm"
                style={{ backgroundColor: PALETTE.elevated, border: `1px solid ${PALETTE.border}`, color: PALETTE.textPrimary }}
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm mb-1" style={{ color: PALETTE.textSecondary }}>NEXLIN is requesting:</p>
            {[
              'WhatsApp Business Management — create and manage your WABA',
              'Business Asset Management — associate this phone number and templates',
              'Webhook Management — configure message and status webhooks automatically',
            ].map((perm) => (
              <div key={perm} className="flex items-start gap-2.5 px-4 py-2.5 rounded-lg" style={{ backgroundColor: PALETTE.elevated, border: `1px solid ${PALETTE.border}` }}>
                <ShieldCheck size={16} style={{ color: PALETTE.whatsapp, marginTop: 2, flexShrink: 0 }} />
                <span className="text-sm" style={{ color: PALETTE.textPrimary }}>{perm}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 pb-6 flex items-center justify-between">
        {step > 0 && step < totalSteps - 1 ? (
          <button onClick={() => setStep((s) => s - 1)} className="flex items-center gap-1.5 text-sm" style={{ color: PALETTE.textSecondary }}>
            <ArrowLeft size={14} /> Back
          </button>
        ) : <span />}
        {step !== 1 && step < totalSteps - 1 && (
          <button
            onClick={step === totalSteps - 2
              ? () => {
                  setLoading(true)
                  setTimeout(() => {
                    setLoading(false)
                    onConnected(phoneNumberId || '109283746501928', accessToken || 'EAAG_demo')
                  }, 900)
                }
              : goNext}
            disabled={
              (step === 2 && !waba) ||
              (step === 3 && (!otpSent || otp.length !== 6)) ||
              (step === 4 && !displayName.trim())
            }
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-40"
            style={{ backgroundColor: PALETTE.whatsapp, color: '#06301A' }}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {step === totalSteps - 2 ? 'Finish setup' : 'Continue'}
          </button>
        )}
      </div>
    </div>
  )
}

function EmailWizard({ onClose, onConnected }: { onClose: () => void; onConnected: (provider: string) => void }) {
  const [step, setStep] = useState(0)
  const [provider, setProvider] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function pick(p: string) {
    setProvider(p)
    setLoading(true)
    setTimeout(() => { setLoading(false); setStep(1) }, 800)
  }

  function allow() {
    setLoading(true)
    setTimeout(() => { setLoading(false); onConnected(provider!) }, 700)
  }

  const providerColor = provider === 'google' ? PALETTE.google : PALETTE.microsoft
  const providerEmail = provider === 'google' ? 'sales@rodriguezautosales.com' : 'sales@rodriguezautosales.onmicrosoft.com'

  return (
    <div className="modal-enter w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: PALETTE.panel, border: `1px solid ${PALETTE.border}` }}>
      <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
        <div className="flex items-center gap-2.5">
          <Mail size={20} style={{ color: PALETTE.textPrimary }} />
          <span className="font-semibold text-base" style={{ color: PALETTE.textPrimary }}>Connect email</span>
        </div>
        <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg" style={{ color: PALETTE.textSecondary }}>
          <X size={18} />
        </button>
      </div>

      <div className="px-6 py-6 min-h-[200px] flex flex-col justify-center">
        {step === 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm mb-1" style={{ color: PALETTE.textSecondary }}>Sign in the way you already do — nothing new to set up.</p>
            <button
              onClick={() => pick('google')}
              disabled={loading}
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg font-medium text-sm disabled:opacity-60"
              style={{ backgroundColor: PALETTE.elevated, border: `1px solid ${PALETTE.border}`, color: PALETTE.textPrimary }}
            >
              {loading && provider === 'google' ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} style={{ color: PALETTE.google }} />}
              Continue with Google
            </button>
            <button
              onClick={() => pick('microsoft')}
              disabled={loading}
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg font-medium text-sm disabled:opacity-60"
              style={{ backgroundColor: PALETTE.elevated, border: `1px solid ${PALETTE.border}`, color: PALETTE.textPrimary }}
            >
              {loading && provider === 'microsoft' ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} style={{ color: PALETTE.microsoft }} />}
              Continue with Microsoft
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="px-4 py-3 rounded-lg" style={{ backgroundColor: PALETTE.elevated, border: `1px solid ${PALETTE.border}` }}>
              <p className="text-xs font-medium mb-2" style={{ color: PALETTE.textSecondary }}>NEXLIN wants to:</p>
              {['Read and send email on your behalf', 'View your contacts'].map((line) => (
                <div key={line} className="flex items-center gap-2 py-1">
                  <Check size={13} style={{ color: providerColor }} />
                  <span className="text-sm" style={{ color: PALETTE.textPrimary }}>{line}</span>
                </div>
              ))}
            </div>
            <p className="font-mono text-xs text-center" style={{ color: PALETTE.textTertiary }}>{providerEmail}</p>
            <button
              onClick={allow}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-60"
              style={{ backgroundColor: providerColor, color: '#FFFFFF' }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Allow
            </button>
          </div>
        )}
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
  const bottomRef = useRef<HTMLDivElement>(null)

  const [channels, setChannels] = useState({
    sms: { connected: true, label: '(214) 555-0142' },
    whatsapp: { connected: initialConversations.some(c => c.channel === 'whatsapp'), label: null as string | null },
    email: { connected: initialConversations.some(c => c.channel === 'email'), label: null as string | null },
  })

  const selected = conversations.find(c => c.id === selectedId) || conversations[0] || null

  useEffect(() => {
    if (!selected?.id) return
    getMessages(selected.id).then(res => {
      if (res.success) setMessages(res.data || [])
    })
  }, [selected?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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
      toast.error('error' in res ? res.error : "Failed to send message")
    }
    setIsSending(false)
  }

  async function handleAiReply() {
    if (!selected) return
    setIsAiLoading(true)
    const res = await generateAiReply("chat", selected.id)
    if (res.success && res.data) {
      setNewMessage(res.data)
    } else {
      toast.error("AI reply failed")
    }
    setIsAiLoading(false)
  }

  async function handleWhatsAppConnected(phoneNumberId: string, token: string) {
    await saveChannelCredentials({ whatsappPhoneNumberId: phoneNumberId, whatsappAccessToken: token })
    setChannels(c => ({ ...c, whatsapp: { connected: true, label: '+1 (214) 555-0198' } }))
    setActiveModal(null)
    toast.success("WhatsApp Business connected")
  }

  async function handleEmailConnected(provider: string) {
    const label = provider === 'google' ? 'sales@rodriguezautosales.com' : 'sales@rodriguezautosales.onmicrosoft.com'
    await saveChannelCredentials({ emailAddress: label, smtpHost: 'smtp.gmail.com', smtpPort: '587', smtpUser: label })
    setChannels(c => ({ ...c, email: { connected: true, label } }))
    setActiveModal(null)
    toast.success("Email connected")
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
      setNewName(""); setNewPhone("")
      toast.success(`${newChannel.toUpperCase()} conversation started`)
    } else {
      toast.error('error' in res ? res.error : "Failed")
    }
    setIsCreating(false)
  }

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true
    const name = `${c.contact?.firstName || ''} ${c.contact?.lastName || ''}`.toLowerCase()
    return name.includes(searchQuery.toLowerCase()) || (c.contact?.phone || '').includes(searchQuery)
  })

  return (
    <>
      <style>{`
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .modal-enter { animation: modalIn 0.18s ease-out; }
        @keyframes rowIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .row-in { animation: rowIn 0.2s ease-out; }
      `}</style>

      <div className="h-full flex flex-col" style={{ backgroundColor: PALETTE.base }}>
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
          <div>
            <h1 className="font-bold text-xl" style={{ color: PALETTE.textPrimary, fontFamily: "'Syne', sans-serif" }}>Inbox</h1>
            <p className="text-xs mt-0.5" style={{ color: PALETTE.textSecondary }}>Every conversation, one thread of channels.</p>
          </div>
          <button
            onClick={() => setIsNewChatOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ backgroundColor: PALETTE.blue, color: '#fff' }}
          >
            <Plus size={14} /> New Chat
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: '220px 260px 1fr' }}>

            {/* Channels Rail */}
            <div className="flex flex-col gap-1.5 p-3 overflow-y-auto" style={{ borderRight: `1px solid ${PALETTE.border}`, backgroundColor: PALETTE.panel }}>
              <span className="text-[10px] font-semibold tracking-widest uppercase px-1 pb-1 pt-1" style={{ color: PALETTE.textTertiary, fontFamily: "'IBM Plex Mono', monospace" }}>Channels</span>

              {/* SMS — always connected */}
              <div className="flex items-center justify-between px-2.5 py-2.5 rounded-lg" style={{ backgroundColor: PALETTE.elevated }}>
                <div className="flex items-center gap-2">
                  <MessageSquare size={15} style={{ color: PALETTE.blue }} />
                  <div>
                    <p className="text-sm font-medium leading-tight" style={{ color: PALETTE.textPrimary }}>Text / SMS</p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: PALETTE.textTertiary }}>{channels.sms.label}</p>
                  </div>
                </div>
                <Check size={13} style={{ color: PALETTE.blue }} />
              </div>

              {/* WhatsApp */}
              <button
                onClick={() => !channels.whatsapp.connected && setActiveModal('whatsapp')}
                className="flex items-center justify-between px-2.5 py-2.5 rounded-lg text-left transition-colors"
                style={{
                  backgroundColor: channels.whatsapp.connected ? PALETTE.elevated : 'transparent',
                  border: channels.whatsapp.connected ? 'none' : `1px dashed ${PALETTE.border}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle size={15} style={{ color: PALETTE.whatsapp }} />
                  <div>
                    <p className="text-sm font-medium leading-tight" style={{ color: PALETTE.textPrimary }}>WhatsApp</p>
                    <p className="text-[10px] mt-0.5" style={{ color: PALETTE.textTertiary }}>
                      {channels.whatsapp.connected ? channels.whatsapp.label : 'Not connected'}
                    </p>
                  </div>
                </div>
                {channels.whatsapp.connected
                  ? <Check size={13} style={{ color: PALETTE.whatsapp }} />
                  : <ChevronRight size={13} style={{ color: PALETTE.textTertiary }} />}
              </button>

              {/* Email */}
              <button
                onClick={() => !channels.email.connected && setActiveModal('email')}
                className="flex items-center justify-between px-2.5 py-2.5 rounded-lg text-left transition-colors"
                style={{
                  backgroundColor: channels.email.connected ? PALETTE.elevated : 'transparent',
                  border: channels.email.connected ? 'none' : `1px dashed ${PALETTE.border}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <Mail size={15} style={{ color: PALETTE.gold }} />
                  <div>
                    <p className="text-sm font-medium leading-tight" style={{ color: PALETTE.textPrimary }}>Email</p>
                    <p className="text-[10px] mt-0.5 truncate max-w-[120px]" style={{ color: PALETTE.textTertiary }}>
                      {channels.email.connected ? channels.email.label : 'Not connected'}
                    </p>
                  </div>
                </div>
                {channels.email.connected
                  ? <Check size={13} style={{ color: PALETTE.gold }} />
                  : <ChevronRight size={13} style={{ color: PALETTE.textTertiary }} />}
              </button>
            </div>

            {/* Conversation List */}
            <div className="flex flex-col overflow-hidden" style={{ borderRight: `1px solid ${PALETTE.border}`, backgroundColor: PALETTE.panel }}>
              <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
                <Search size={13} style={{ color: PALETTE.textTertiary }} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search conversations"
                  className="bg-transparent outline-none text-sm w-full"
                  style={{ color: PALETTE.textSecondary }}
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <p className="text-sm" style={{ color: PALETTE.textTertiary }}>No conversations yet.</p>
                    <button
                      onClick={() => setIsNewChatOpen(true)}
                      className="mt-3 text-xs px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: PALETTE.elevated, border: `1px solid ${PALETTE.border}`, color: PALETTE.textSecondary }}
                    >
                      + Start one
                    </button>
                  </div>
                ) : filteredConversations.map(c => {
                  const name = c.contact ? `${c.contact.firstName || ''} ${c.contact.lastName || ''}`.trim() || 'Contact' : 'Contact'
                  const preview = c.messages?.[0]?.content || 'No messages yet'
                  const time = new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  const isActive = c.id === selectedId
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className="row-in w-full text-left px-4 py-3 flex items-start gap-2.5"
                      style={{
                        backgroundColor: isActive ? PALETTE.elevated : 'transparent',
                        borderBottom: `1px solid ${PALETTE.border}`,
                      }}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        <ChannelIcon channel={c.channel} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate" style={{ color: PALETTE.textPrimary }}>{name}</span>
                          <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: PALETTE.textTertiary }}>{time}</span>
                        </div>
                        <p className="text-xs truncate mt-0.5" style={{ color: PALETTE.textTertiary }}>{preview}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Thread View */}
            <div className="flex flex-col overflow-hidden" style={{ backgroundColor: PALETTE.panel }}>
              {selected ? (
                <>
                  {/* Thread Header */}
                  <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
                    <div className="flex items-center gap-2.5">
                      <ChannelIcon channel={selected.channel} size={18} />
                      <div>
                        <span className="font-semibold text-sm" style={{ color: PALETTE.textPrimary, fontFamily: "'Syne', sans-serif" }}>
                          {selected.contact ? `${selected.contact.firstName || ''} ${selected.contact.lastName || ''}`.trim() || 'Contact' : 'Contact'}
                        </span>
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: PALETTE.textTertiary }}>
                          {selected.contact?.phone || selected.contact?.email || selected.channel.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAiReply}
                        disabled={isAiLoading}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: 'rgba(26,60,255,0.15)', color: PALETTE.blue, border: `1px solid rgba(26,60,255,0.3)` }}
                      >
                        {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        AI Reply
                      </button>
                      <MoreHorizontal size={16} style={{ color: PALETTE.textTertiary }} />
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 px-5 py-4 flex flex-col gap-3 overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm" style={{ color: PALETTE.textTertiary }}>No messages yet. Send one below.</p>
                      </div>
                    ) : messages.map((m, i) => (
                      <div key={m.id || i} className={`flex ${m.isOutbound ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className="max-w-[75%] px-3.5 py-2 rounded-xl"
                          style={{
                            backgroundColor: m.isOutbound ? PALETTE.blue : PALETTE.elevated,
                            color: m.isOutbound ? '#FFFFFF' : PALETTE.textPrimary,
                          }}
                        >
                          <p className="text-sm leading-relaxed">{m.content}</p>
                          <p className="text-[10px] mt-1 opacity-60">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>

                  {/* Composer */}
                  <div className="px-5 py-3.5 flex-shrink-0" style={{ borderTop: `1px solid ${PALETTE.border}` }}>
                    <div className="flex items-end gap-2">
                      <textarea
                        rows={1}
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                        placeholder={`Reply via ${selected.channel}...`}
                        className="flex-1 px-4 py-2.5 rounded-lg outline-none text-sm resize-none"
                        style={{
                          backgroundColor: PALETTE.elevated,
                          border: `1px solid ${PALETTE.border}`,
                          color: PALETTE.textPrimary,
                          maxHeight: 120,
                        }}
                      />
                      <button
                        onClick={handleSend}
                        disabled={isSending || !newMessage.trim()}
                        className="p-2.5 rounded-lg flex-shrink-0 disabled:opacity-40 transition-opacity"
                        style={{ backgroundColor: PALETTE.blue, color: '#fff' }}
                      >
                        {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
                  <InboxIcon size={28} style={{ color: PALETTE.textTertiary }} />
                  <p className="text-sm" style={{ color: PALETTE.textTertiary }}>Connect a channel to start seeing conversations here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setIsNewChatOpen(false)}>
          <div className="modal-enter w-full max-w-sm rounded-2xl overflow-hidden" style={{ backgroundColor: PALETTE.panel, border: `1px solid ${PALETTE.border}` }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
              <span className="font-semibold text-sm" style={{ color: PALETTE.textPrimary }}>Start new conversation</span>
              <button onClick={() => setIsNewChatOpen(false)} style={{ color: PALETTE.textSecondary }}><X size={16} /></button>
            </div>
            <form onSubmit={handleNewChat} className="px-5 py-4 flex flex-col gap-3">
              <input
                placeholder="Contact name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg outline-none text-sm"
                style={{ backgroundColor: PALETTE.elevated, border: `1px solid ${PALETTE.border}`, color: PALETTE.textPrimary }}
              />
              <input
                placeholder="Phone or email"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg outline-none text-sm font-mono"
                style={{ backgroundColor: PALETTE.elevated, border: `1px solid ${PALETTE.border}`, color: PALETTE.textPrimary }}
              />
              <select
                value={newChannel}
                onChange={e => setNewChannel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg outline-none text-sm"
                style={{ backgroundColor: PALETTE.elevated, border: `1px solid ${PALETTE.border}`, color: PALETTE.textPrimary }}
              >
                <option value="sms">💬 SMS</option>
                <option value="whatsapp">📱 WhatsApp</option>
                <option value="email">✉️ Email</option>
              </select>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setIsNewChatOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ backgroundColor: PALETTE.elevated, border: `1px solid ${PALETTE.border}`, color: PALETTE.textSecondary }}>Cancel</button>
                <button type="submit" disabled={isCreating || !newPhone.trim()} className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2" style={{ backgroundColor: PALETTE.blue, color: '#fff' }}>
                  {isCreating && <Loader2 size={14} className="animate-spin" />}
                  {isCreating ? 'Creating...' : 'Start Chat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Channel Modals */}
      {activeModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setActiveModal(null)}>
          <div onClick={e => e.stopPropagation()}>
            {activeModal === 'whatsapp' && <WhatsAppWizard onClose={() => setActiveModal(null)} onConnected={handleWhatsAppConnected} />}
            {activeModal === 'email' && <EmailWizard onClose={() => setActiveModal(null)} onConnected={handleEmailConnected} />}
          </div>
        </div>
      )}
    </>
  )
}
