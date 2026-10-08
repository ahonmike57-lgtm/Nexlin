"use client"

import { useState, useEffect, useCallback } from "react"
import { MessageSquare, X, Send, Sparkles, Loader2, Mail, Phone, ChevronLeft, Bot, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { generateAiReply } from "@/app/actions/ai"
import { getConversations, getMessages, sendMessage } from "@/app/actions/chat"
import { toast } from "sonner"
import { getPusherClient } from "@/lib/pusher"

interface MessageItem {
  id: string
  sender: string
  content: string
  isOutbound: boolean
  channel: "sms" | "whatsapp" | "email"
  time: string
}

interface ThreadItem {
  id: string
  contactName: string
  channel: "sms" | "whatsapp" | "email"
  lastMessage: string
  unread: boolean
  time: string
  messages?: MessageItem[]
}

export function OmniChatDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [threads, setThreads] = useState<ThreadItem[]>([])
  const [activeMessages, setActiveMessages] = useState<MessageItem[]>([])
  const [isLoadingThreads, setIsLoadingThreads] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [channelFilter, setChannelFilter] = useState<"all" | "sms" | "whatsapp" | "email">("all")
  const [replyText, setReplyText] = useState("")
  const [isAiGenerating, setIsAiGenerating] = useState(false)

  const activeThread = threads.find((t) => t.id === activeThreadId)
  const unreadCount = threads.filter((t) => t.unread).length

  const filteredThreads = threads.filter(
    (t) => channelFilter === "all" || t.channel === channelFilter
  )

  const loadConversations = useCallback(async () => {
    setIsLoadingThreads(true)
    try {
      const data = await getConversations()
      if (Array.isArray(data)) {
        const mapped: ThreadItem[] = data.map((conv: any) => {
          const lastMsg = conv.messages?.[0]
          const contactName = conv.contact
            ? `${conv.contact.firstName} ${conv.contact.lastName || ""}`.trim()
            : "Unknown Lead"
          
          let timeDisplay = "Recently"
          if (conv.updatedAt) {
            const date = new Date(conv.updatedAt)
            timeDisplay = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }

          return {
            id: conv.id,
            contactName: contactName || "Visitor",
            channel: (conv.channel || "whatsapp") as "sms" | "whatsapp" | "email",
            lastMessage: lastMsg?.content || "Started a new conversation",
            unread: lastMsg ? !lastMsg.isOutbound : false,
            time: timeDisplay
          }
        })
        setThreads(mapped)
      }
    } catch (e) {
      console.error("Failed to load conversations in OmniChatDrawer", e)
    } finally {
      setIsLoadingThreads(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadConversations()
    }
  }, [isOpen, loadConversations])

  // Load messages when a thread is selected
  useEffect(() => {
    if (!activeThreadId) {
      setActiveMessages([])
      return
    }

    let isSubscribed = true
    setIsLoadingMessages(true)

    getMessages(activeThreadId)
      .then((msgs: any) => {
        if (!isSubscribed) return
        if (Array.isArray(msgs)) {
          const formatted: MessageItem[] = msgs.map((m: any) => ({
            id: m.id,
            sender: m.isOutbound ? "You" : (activeThread?.contactName || "Contact"),
            content: m.content,
            isOutbound: m.isOutbound,
            channel: activeThread?.channel || "whatsapp",
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }))
          setActiveMessages(formatted)
        }
      })
      .catch((err: any) => {
        console.error("Failed to fetch messages for thread", err)
      })
      .finally(() => {
        if (isSubscribed) setIsLoadingMessages(false)
      })

    // Subscribe to live Pusher events for this thread
    const channelName = `conversation-${activeThreadId}`
    const pusher = getPusherClient()
    const pusherChan = pusher.subscribe(channelName)

    pusherChan.bind("new-message", (incoming: any) => {
      setActiveMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev
        return [
          ...prev,
          {
            id: incoming.id,
            sender: incoming.isOutbound ? "You" : (activeThread?.contactName || "Contact"),
            content: incoming.content,
            isOutbound: incoming.isOutbound,
            channel: activeThread?.channel || "whatsapp",
            time: new Date(incoming.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]
      })
    })

    return () => {
      isSubscribed = false
      pusherChan.unbind_all()
      pusher.unsubscribe(channelName)
    }
  }, [activeThreadId, activeThread?.channel, activeThread?.contactName])

  const handleSendMessage = async () => {
    if (!replyText.trim() || !activeThreadId || !activeThread) return

    const content = replyText.trim()
    setReplyText("")

    // Optimistic UI push
    const tempId = `temp-${Date.now()}`
    const tempMsg: MessageItem = {
      id: tempId,
      sender: "You",
      content,
      isOutbound: true,
      channel: activeThread.channel,
      time: "Just now"
    }

    setActiveMessages((prev) => [...prev, tempMsg])
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? { ...t, lastMessage: content, unread: false }
          : t
      )
    )

    try {
      await sendMessage(activeThreadId, content, activeThread.channel, true)
      toast.success(`Sent via ${activeThread.channel.toUpperCase()}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to send message")
      // Remove failed optimistic msg
      setActiveMessages((prev) => prev.filter((m) => m.id !== tempId))
    }
  }

  const handleAiSuggestedReply = async () => {
    if (!activeThread) return
    setIsAiGenerating(true)

    try {
      const lastIncoming = activeMessages.filter((m) => !m.isOutbound).pop()?.content || activeThread.lastMessage
      const aiRes = await generateAiReply(
        "",
        `You are an expert sales SDR. The lead said: "${lastIncoming}". Write a helpful, professional, high-converting 1-sentence reply to close the deal or confirm booking.`
      )

      if (aiRes.success && aiRes.data) {
        setReplyText(aiRes.data.replace(/["']/g, "").trim())
        toast.success("AI draft generated! ✨")
      }
    } catch {
      toast.error("AI reply failed")
    } finally {
      setIsAiGenerating(false)
    }
  }

  const getChannelBadge = (ch: "sms" | "whatsapp" | "email") => {
    switch (ch) {
      case "sms":
        return <Badge variant="outline" className="text-[10px] text-emerald-500 bg-emerald-500/10 border-emerald-500/20 font-semibold">SMS</Badge>
      case "whatsapp":
        return <Badge variant="outline" className="text-[10px] text-green-500 bg-green-500/10 border-green-500/20 font-semibold">WhatsApp</Badge>
      case "email":
        return <Badge variant="outline" className="text-[10px] text-blue-500 bg-blue-500/10 border-blue-500/20 font-semibold">Email</Badge>
    }
  }

  return (
    <>
      {/* Floating Trigger Dock Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-primary text-white shadow-xl hover:bg-primary/90 hover:scale-105 transition-all duration-200 border border-white/20 cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs font-semibold">Omni-Inbox</span>
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Slide-Out Drawer Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[540px] rounded-2xl bg-bg-primary border border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 border-b border-border bg-bg-secondary/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeThreadId && (
                <button
                  onClick={() => setActiveThreadId(null)}
                  className="p-1 rounded-lg hover:bg-bg-secondary text-text-secondary hover:text-text-primary mr-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-sm text-text-primary truncate max-w-[200px]">
                {activeThread ? activeThread.contactName : "Omni-Inbox Quick-Reply"}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={loadConversations}
                disabled={isLoadingThreads}
                className="p-1 rounded-lg hover:bg-bg-secondary text-text-secondary hover:text-text-primary cursor-pointer disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingThreads ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-bg-secondary text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation List View */}
          {!activeThreadId ? (
            <>
              {/* Channel Filter Pills */}
              <div className="p-2 border-b border-border flex gap-1 bg-bg-secondary/20 text-xs">
                {(["all", "sms", "whatsapp", "email"] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannelFilter(ch)}
                    className={`px-2.5 py-1 rounded-md capitalize transition-all cursor-pointer ${
                      channelFilter === ch
                        ? "bg-primary text-white font-medium shadow-sm"
                        : "text-text-secondary hover:bg-bg-secondary"
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>

              {/* Thread Feed */}
              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {isLoadingThreads ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-text-secondary">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                    <span className="text-xs">Loading conversations...</span>
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="text-center py-12 text-text-secondary text-xs px-4">
                    No conversations found. Inbound messages via WhatsApp, SMS, or Email will populate here automatically.
                  </div>
                ) : (
                  filteredThreads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => {
                        setActiveThreadId(thread.id)
                        setThreads((prev) =>
                          prev.map((t) => (t.id === thread.id ? { ...t, unread: false } : t))
                        )
                      }}
                      className={`p-3.5 hover:bg-bg-secondary/60 transition-colors cursor-pointer flex flex-col gap-1.5 ${
                        thread.unread ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-text-primary flex items-center gap-1.5">
                          {thread.contactName}
                          {thread.unread && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </span>
                        <span className="text-[10px] text-text-secondary">{thread.time}</span>
                      </div>

                      <p className="text-xs text-text-secondary truncate">{thread.lastMessage}</p>

                      <div className="flex items-center gap-2 mt-0.5">
                        {getChannelBadge(thread.channel)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Active Thread Message View */
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full py-8 text-text-secondary text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" /> Loading chat...
                  </div>
                ) : activeMessages.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary text-xs">
                    No messages in this conversation yet. Send a quick reply below.
                  </div>
                ) : (
                  activeMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.isOutbound ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[82%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                          msg.isOutbound
                            ? "bg-primary text-white rounded-br-none"
                            : "bg-bg-secondary text-text-primary border border-border rounded-bl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-text-secondary mt-0.5 px-1">{msg.time}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Box & AI Copilot Button */}
              <div className="p-3 border-t border-border bg-bg-secondary/40 space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleAiSuggestedReply}
                    disabled={isAiGenerating}
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium disabled:opacity-50 cursor-pointer"
                  >
                    {isAiGenerating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-primary" />
                    )}
                    <span>AI Suggested SDR Reply</span>
                  </button>
                  <span className="text-[10px] text-text-secondary uppercase">
                    Via {activeThread?.channel}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Type your quick reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    className="text-xs h-9 bg-bg-primary"
                  />
                  <Button size="sm" onClick={handleSendMessage} className="h-9 px-3">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
