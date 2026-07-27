"use client"

import { useState, useEffect } from "react"
import PusherClient from "pusher-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, Filter, MoreVertical, Paperclip, Smile, Send, 
  Mail, MessageSquare, Phone, User, Clock, Check, CheckCheck, Sparkles, Plus, Loader2, Link2, ShieldCheck, AlertCircle, Wrench 
} from "lucide-react"

import { getMessages, sendMessage, createConversation, createQuickContactAndConversation, resolveMetaWhatsappError } from "@/app/actions/chat"
import { getChannelCredentials, saveChannelCredentials } from "@/app/actions/channel-credentials"
import { generateAiReply } from "@/app/actions/ai"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function ChatClient({ initialConversations }: { initialConversations: any[] }) {
  const [conversations, setConversations] = useState<any[]>(initialConversations)
  const [activeConversation, setActiveConversation] = useState<any>(initialConversations[0] || null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  
  // Filter & Search States
  const [filterChannel, setFilterChannel] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeChannel, setActiveChannel] = useState<string>(activeConversation?.channel || "whatsapp")

  // New Conversation Modal State
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [newContactName, setNewContactName] = useState("")
  const [newContactPhone, setNewContactPhone] = useState("")
  const [newChannel, setNewChannel] = useState("whatsapp")
  const [isCreatingChat, setIsCreatingChat] = useState(false)

  // Channel Link Setup Modal State
  const [isSetupOpen, setIsSetupOpen] = useState(false)
  const [savingCredentials, setSavingCredentials] = useState(false)
  const [channelData, setChannelData] = useState({
    whatsappPhoneNumberId: "",
    whatsappWabaId: "",
    whatsappAccessToken: "",
    emailAddress: "",
    smtpHost: "smtp.sendgrid.net",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    isWhatsappConnected: false,
    isEmailConnected: false
  })

  // Meta Error Diagnostic Modal State
  const [metaErrorModal, setMetaErrorModal] = useState<any>(null)

  // Load Channel Credentials
  useEffect(() => {
    getChannelCredentials().then(res => {
      if (res.success && res.data) {
        setChannelData(prev => ({ ...prev, ...res.data }))
      }
    })
  }, [])

  // Update activeChannel when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      setActiveChannel(activeConversation.channel || "whatsapp")
    }
  }, [activeConversation])

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversation?.id) {
      getMessages(activeConversation.id).then(res => {
        if (res.success) setMessages(res.data || [])
      })

      // Pusher subscription
      const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || "mock_key", {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
      })

      const channel = pusher.subscribe(`conversation-${activeConversation.id}`)
      channel.bind("new-message", (data: any) => {
        setMessages((prev) => {
          if (prev.find(m => m.id === data.id)) return prev
          return [...prev, data]
        })
      })

      return () => {
        pusher.unsubscribe(`conversation-${activeConversation.id}`)
      }
    }
  }, [activeConversation])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return
    
    setIsLoading(true)
    const res = await sendMessage(activeConversation.id, newMessage)
    if (res.success && res.data) {
      setMessages(prev => [...prev, res.data])
      setNewMessage("")
      toast.success(`Message dispatched via ${activeConversation.channel.toUpperCase()}`)
    } else {
      toast.error(res.error || "Failed to send message")
    }
    setIsLoading(false)
  }

  const handleAiReply = async () => {
    if (!activeConversation) return
    setIsAiLoading(true)
    try {
      const res = await generateAiReply("chat", activeConversation.id)
      if (res.success && res.data) {
        setNewMessage(res.data)
        toast.success("AI reply generated!")
      } else {
        toast.error("AI Error: " + (res.error || "Unknown error"))
      }
    } catch (err: any) {
      toast.error("Client Error: " + err.message)
    }
    setIsAiLoading(false)
  }

  const handleChannelSwitch = async (channel: string) => {
    if (!activeConversation) return
    setActiveChannel(channel)

    const res = await createConversation(activeConversation.contactId, channel)
    if (res.success && res.data) {
      const convData = res.data
      setActiveConversation(convData)
      setConversations(prev => {
        const exists = prev.some(c => c.id === convData.id)
        if (exists) return prev.map(c => c.id === convData.id ? convData : c)
        return [convData, ...prev]
      })
      toast.success(`Switched active channel to ${channel.toUpperCase()}`)
    }
  }

  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContactPhone.trim()) return

    setIsCreatingChat(true)
    const res = await createQuickContactAndConversation(
      newContactName.trim() || "New Lead",
      newContactPhone.trim(),
      newChannel
    )

    if (res.success && res.data) {
      const conv = res.data
      setConversations(prev => [conv, ...prev.filter(c => c.id !== conv.id)])
      setActiveConversation(conv)
      setIsNewDialogOpen(false)
      setNewContactName("")
      setNewContactPhone("")
      toast.success(`New ${newChannel.toUpperCase()} conversation started!`)
    } else {
      toast.error(res.error || "Failed to create conversation")
    }
    setIsCreatingChat(false)
  }

  const handleSaveChannelCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCredentials(true)
    const res = await saveChannelCredentials(channelData)
    if (res.success) {
      toast.success(res.message)
      setIsSetupOpen(false)
      getChannelCredentials().then(r => r.success && setChannelData(prev => ({ ...prev, ...r.data })))
    } else {
      toast.error(res.error || "Failed to save credentials")
    }
    setSavingCredentials(false)
  }

  const handleFixMetaError3538221404 = async () => {
    const diag = await resolveMetaWhatsappError("3538221404")
    setMetaErrorModal(diag)
    setNewMessage("Hello! This is a Meta Approved WhatsApp Utility Notification regarding your account & appointment update.")
    toast.success("Meta Error 3538221404 Bypasser Active: Template loaded!")
  }

  const ChannelIcon = ({ type, className = "" }: { type: string, className?: string }) => {
    switch (type?.toLowerCase()) {
      case "email": return <Mail className={`w-4 h-4 ${className}`} />
      case "whatsapp": return <MessageSquare className={`w-4 h-4 text-success ${className}`} />
      case "sms": return <Phone className={`w-4 h-4 text-primary ${className}`} />
      default: return <Mail className={`w-4 h-4 ${className}`} />
    }
  }

  const filteredConversations = conversations.filter(conv => {
    if (filterChannel !== "all" && conv.channel?.toLowerCase() !== filterChannel.toLowerCase()) {
      return false
    }
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const name = `${conv.contact?.firstName || ""} ${conv.contact?.lastName || ""}`.toLowerCase()
    return name.includes(q) || (conv.contact?.phone || "").includes(q)
  })

  return (
    <div className="h-full flex flex-col bg-bg-secondary rounded-xl border border-border overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - Conversation List */}
        <div className="w-80 flex-shrink-0 border-r border-border bg-bg-primary flex flex-col">
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Inbox</h2>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setIsSetupOpen(true)}>
                  <Link2 className="w-3.5 h-3.5 mr-1 text-primary" /> Link Channels
                </Button>
                <Button size="sm" className="h-8 text-xs" onClick={() => setIsNewDialogOpen(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> New
                </Button>
              </div>
            </div>

            {/* Channel Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              <Badge 
                className={`cursor-pointer ${filterChannel === "all" ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80"}`}
                onClick={() => setFilterChannel("all")}
              >
                All
              </Badge>
              <Badge 
                className={`cursor-pointer ${filterChannel === "whatsapp" ? "bg-success text-white" : "bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80"}`}
                onClick={() => setFilterChannel("whatsapp")}
              >
                <MessageSquare className="w-3 h-3 mr-1 text-white" /> WhatsApp
              </Badge>
              <Badge 
                className={`cursor-pointer ${filterChannel === "sms" ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80"}`}
                onClick={() => setFilterChannel("sms")}
              >
                <Phone className="w-3 h-3 mr-1" /> SMS
              </Badge>
              <Badge 
                className={`cursor-pointer ${filterChannel === "email" ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80"}`}
                onClick={() => setFilterChannel("email")}
              >
                <Mail className="w-3 h-3 mr-1" /> Email
              </Badge>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-9 bg-bg-secondary border-none text-xs" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-text-secondary text-xs space-y-2">
                <p>No {filterChannel !== 'all' ? filterChannel : ''} conversations found.</p>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setIsNewDialogOpen(true)}>
                  <Plus className="w-3 h-3 mr-1" /> Start New Chat
                </Button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const contact = conv.contact || {}
                const latestMessage = conv.messages?.[0]
                const isActive = activeConversation?.id === conv.id

                return (
                  <div 
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className={`p-4 border-b border-border cursor-pointer transition-colors ${isActive ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-bg-secondary border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex gap-3">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isActive ? 'bg-primary text-white' : 'bg-bg-secondary text-text-secondary'}`}>
                          {contact.firstName?.charAt(0) || "C"}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-bg-primary rounded-full p-0.5">
                          <ChannelIcon type={conv.channel} />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-semibold truncate text-text-primary">
                            {contact.firstName ? `${contact.firstName} ${contact.lastName || ''}` : 'Contact'}
                          </h4>
                          <span className="text-[10px] text-text-secondary flex-shrink-0 ml-2">
                            {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs truncate text-text-secondary">
                            {latestMessage?.content || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Middle - Active Conversation */}
        <div className="flex-1 flex flex-col bg-bg-primary">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-bg-primary">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {activeConversation.contact?.firstName?.charAt(0) || "C"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {activeConversation.contact?.firstName} {activeConversation.contact?.lastName}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-secondary flex items-center gap-1 font-mono">
                        {activeConversation.contact?.phone || activeConversation.contact?.email || 'No Phone/Email'}
                      </span>
                      {/* Channel Switcher */}
                      <select 
                        value={activeChannel}
                        onChange={(e) => handleChannelSwitch(e.target.value)}
                        className="text-[11px] font-semibold bg-bg-secondary border border-border rounded px-2 py-0.5 text-text-primary focus:outline-none cursor-pointer"
                      >
                        <option value="whatsapp">📱 WhatsApp</option>
                        <option value="sms">💬 SMS</option>
                        <option value="email">✉️ Email</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {activeConversation.channel === "whatsapp" && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs border-amber-500/40 text-amber-500 hover:bg-amber-500/10 gap-1"
                      onClick={handleFixMetaError3538221404}
                    >
                      <Wrench className="w-3.5 h-3.5" /> Fix Error 3538221404
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setIsSetupOpen(true)}>
                    <Link2 className="w-3.5 h-3.5 text-primary" /> Setup Keys
                  </Button>
                  <Badge variant="outline" className="text-xs font-normal capitalize">
                    {activeConversation.channel} Active
                  </Badge>
                </div>
              </div>

              {/* Meta Error 3538221404 Alert Banner */}
              {activeConversation.channel === "whatsapp" && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center justify-between text-xs text-amber-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Meta Error 3538221404 Handler Active:</strong> Outbound messages auto-format as Meta Utility Templates to bypass 24-hour limits.</span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] text-amber-400 hover:text-amber-300 underline" onClick={handleFixMetaError3538221404}>
                    View Fix Guide
                  </Button>
                </div>
              )}

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-bg-secondary/20">
                <div className="flex justify-center">
                  <span className="text-[10px] uppercase font-semibold bg-bg-secondary px-3 py-1 rounded-full text-text-secondary border border-border">
                    {activeConversation.channel} Conversation Log
                  </span>
                </div>
                
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-xs text-text-secondary">
                    No messages yet in this {activeConversation.channel} thread. Type a message below to start chatting.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isOutbound ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.isOutbound ? 'bg-primary text-white rounded-tr-sm' : 'bg-bg-secondary text-text-primary rounded-tl-sm border border-border'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${msg.isOutbound ? 'text-primary-100' : 'text-text-secondary'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.isOutbound && <CheckCheck className="w-3 h-3 text-white/80" />}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* AI Suggestions */}
              <div className="px-6 py-2 flex gap-2 border-t border-border bg-bg-primary">
                <Badge variant="outline" className="cursor-pointer hover:bg-bg-secondary text-xs" onClick={() => setNewMessage("Can we schedule a 15-minute call?")}>Can we schedule a call?</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-bg-secondary text-xs" onClick={() => setNewMessage("I have sent the quote details over.")}>I'll send over the quote.</Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-bg-secondary bg-primary/5 text-primary border-primary/20 text-xs"
                  onClick={handleAiReply}
                >
                  {isAiLoading ? "Generating..." : "✨ Generate AI Reply"}
                </Badge>
              </div>

              {/* Chat Composer */}
              <div className="p-4 bg-bg-primary border-t border-border flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-semibold text-text-secondary uppercase">
                    Replying via {activeConversation.channel.toUpperCase()}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 text-[10px] bg-bg-secondary"
                    onClick={async () => {
                      if (!activeConversation) return;
                      const msg = window.prompt(`Simulate inbound ${activeConversation.channel} customer reply:`);
                      if (msg) {
                        const res = await sendMessage(activeConversation.id, msg, false);
                        if (res.success && res.data) {
                          setMessages(prev => [...prev, res.data])
                        }
                      }
                    }}
                  >
                    Simulate Inbound {activeConversation.channel.toUpperCase()}
                  </Button>
                </div>

                <div className="bg-bg-secondary rounded-xl p-2 border border-border">
                  <textarea 
                    className="w-full bg-transparent border-none resize-none focus:ring-0 text-sm p-2 outline-none text-text-primary placeholder:text-text-secondary"
                    placeholder={`Type your ${activeConversation.channel} message...`}
                    rows={2}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  ></textarea>
                  <div className="flex items-center justify-between mt-2 px-2">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="w-8 h-8"><Paperclip className="w-4 h-4 text-text-secondary" /></Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8"><Smile className="w-4 h-4 text-text-secondary" /></Button>
                    </div>
                    <Button size="sm" className="gap-2" onClick={handleSendMessage} disabled={isLoading || !newMessage.trim()}>
                      {isLoading ? 'Sending...' : 'Send'} <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary text-sm space-y-3">
              <MessageSquare className="w-10 h-10 text-text-secondary/50" />
              <p>Select a conversation from the left inbox sidebar to start messaging.</p>
              <Button size="sm" onClick={() => setIsNewDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Start New Chat
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Start New Chat Modal Dialog */}
      {isNewDialogOpen && (
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogContent className="bg-bg-primary border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="w-5 h-5 text-primary" /> Start New Conversation
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateNewChat} className="space-y-4 pt-2 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-text-primary">Contact Name</label>
                <Input 
                  placeholder="e.g. Sarah Jenkins"
                  value={newContactName}
                  onChange={e => setNewContactName(e.target.value)}
                  className="bg-bg-secondary text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-text-primary">Phone Number or Email</label>
                <Input 
                  placeholder="+1 (555) 019-2834 or sarah@example.com"
                  value={newContactPhone}
                  onChange={e => setNewContactPhone(e.target.value)}
                  className="bg-bg-secondary text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-text-primary">Select Channel</label>
                <select 
                  value={newChannel}
                  onChange={e => setNewChannel(e.target.value)}
                  className="w-full p-2 rounded-lg bg-bg-secondary border border-border text-xs text-text-primary focus:outline-none cursor-pointer font-semibold"
                >
                  <option value="whatsapp">📱 WhatsApp Business API</option>
                  <option value="sms">💬 Twilio SMS / MMS</option>
                  <option value="email">✉️ Email</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsNewDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreatingChat || !newContactPhone.trim()}>
                  {isCreatingChat ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  {isCreatingChat ? "Creating..." : "Start Chat"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Link Channels Credentials Modal */}
      {isSetupOpen && (
        <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
          <DialogContent className="bg-bg-primary border-border sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Link2 className="w-5 h-5 text-primary" /> Link WhatsApp & Email Credentials
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveChannelCredentials} className="space-y-6 pt-2 text-xs">
              {/* WhatsApp Meta Cloud API */}
              <div className="p-4 rounded-xl border border-border bg-bg-secondary/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-text-primary flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-success" /> Meta WhatsApp Business API
                  </div>
                  {channelData.isWhatsappConnected && <Badge className="bg-success text-white text-[10px]">Connected</Badge>}
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] text-text-secondary">WhatsApp Phone Number ID</label>
                    <Input 
                      placeholder="109283746501928"
                      value={channelData.whatsappPhoneNumberId}
                      onChange={e => setChannelData({ ...channelData, whatsappPhoneNumberId: e.target.value })}
                      className="bg-bg-primary text-xs font-mono mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-secondary">Meta Permanent Access Token</label>
                    <Input 
                      type="password"
                      placeholder="EAAG..."
                      value={channelData.whatsappAccessToken}
                      onChange={e => setChannelData({ ...channelData, whatsappAccessToken: e.target.value })}
                      className="bg-bg-primary text-xs font-mono mt-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Email SMTP Server */}
              <div className="p-4 rounded-xl border border-border bg-[#0f172a] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-text-primary flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" /> Agency Email & SMTP Relay
                  </div>
                  {channelData.isEmailConnected && <Badge className="bg-primary text-white text-[10px]">Connected</Badge>}
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] text-text-secondary">Sender Email Address</label>
                    <Input 
                      placeholder="support@youragency.com"
                      value={channelData.emailAddress}
                      onChange={e => setChannelData({ ...channelData, emailAddress: e.target.value })}
                      className="bg-bg-primary text-xs font-mono mt-0.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-text-secondary">SMTP Host</label>
                      <Input 
                        placeholder="smtp.sendgrid.net"
                        value={channelData.smtpHost}
                        onChange={e => setChannelData({ ...channelData, smtpHost: e.target.value })}
                        className="bg-bg-primary text-xs font-mono mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-text-secondary">SMTP User</label>
                      <Input 
                        placeholder="apikey"
                        value={channelData.smtpUser}
                        onChange={e => setChannelData({ ...channelData, smtpUser: e.target.value })}
                        className="bg-bg-primary text-xs font-mono mt-0.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsSetupOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={savingCredentials}>
                  {savingCredentials ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ShieldCheck className="w-4 h-4 mr-1" />}
                  {savingCredentials ? "Encrypted & Saving..." : "Save Credentials"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Meta Error Diagnostic Modal */}
      {metaErrorModal && (
        <Dialog open={!!metaErrorModal} onOpenChange={() => setMetaErrorModal(null)}>
          <DialogContent className="bg-bg-primary border-border sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base text-amber-500">
                <AlertCircle className="w-5 h-5 text-amber-500" /> {metaErrorModal.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200">
                <span className="font-semibold">Root Cause:</span> {metaErrorModal.cause}
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-text-primary">Required Action Steps:</div>
                <ul className="space-y-1.5 text-text-secondary list-disc pl-4">
                  {(metaErrorModal.resolutionSteps || []).map((step: string, i: number) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setMetaErrorModal(null)}>Understood & Applied</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
