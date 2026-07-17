"use client"

import { useState, useEffect } from "react"
import PusherClient from "pusher-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, Filter, MoreVertical, Paperclip, Smile, Send, 
  Mail, MessageSquare, Phone, User, Clock, Check, CheckCheck 
} from "lucide-react"

import { getMessages, sendMessage } from "@/app/actions/chat"
import { generateAiReply } from "@/app/actions/ai"

export default function ChatClient({ initialConversations }: { initialConversations: any[] }) {
  const [activeConversation, setActiveConversation] = useState<any>(initialConversations[0] || null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversation) {
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
      setMessages([...messages, res.data])
      setNewMessage("")
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
      } else {
        alert("AI Error: " + (res.error || "Unknown error"))
      }
    } catch (err: any) {
      alert("Client Error: " + err.message)
    }
    setIsAiLoading(false)
  }

  const ChannelIcon = ({ type, className = "" }: { type: string, className?: string }) => {
    switch (type) {
      case "email": return <Mail className={`w-4 h-4 ${className}`} />
      case "whatsapp": return <MessageSquare className={`w-4 h-4 text-success ${className}`} />
      case "sms": return <Phone className={`w-4 h-4 text-primary ${className}`} />
      default: return <Mail className={`w-4 h-4 ${className}`} />
    }
  }

  return (
    <div className="h-full flex flex-col bg-bg-secondary rounded-xl border border-border overflow-hidden ">
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - Conversation List */}
        <div className="w-80 flex-shrink-0 border-r border-border bg-bg-primary flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-semibold mb-4">Inbox</h2>
            <div className="flex gap-2 mb-4">
              <Badge className="bg-primary/10 text-primary cursor-pointer hover:bg-primary/20">All</Badge>
              <Badge variant="outline" className="cursor-pointer text-text-secondary"><Mail className="w-3 h-3 mr-1" /> Email</Badge>
              <Badge variant="outline" className="cursor-pointer text-text-secondary"><MessageSquare className="w-3 h-3 mr-1" /> WhatsApp</Badge>
              <Badge variant="outline" className="cursor-pointer text-text-secondary"><Phone className="w-3 h-3 mr-1" /> SMS</Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <Input placeholder="Search messages..." className="pl-9 bg-bg-secondary border-none" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {initialConversations.map((conv) => {
              const contact = conv.contact
              const latestMessage = conv.messages?.[0]
              
              return (
              <div 
                key={conv.id}
                onClick={() => {
                  setActiveConversation(conv)
                  getMessages(conv.id).then(res => {
                    if (res.success) setMessages(res.data || [])
                  })
                }}
                className={`p-4 border-b border-border cursor-pointer transition-colors ${activeConversation?.id === conv.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-bg-secondary border-l-4 border-l-transparent'}`}
              >
                <div className="flex gap-3">
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${activeConversation?.id === conv.id ? 'bg-primary text-white' : 'bg-bg-secondary text-text-secondary'}`}>
                      {contact.firstName?.charAt(0) || "U"}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-bg-primary rounded-full p-0.5">
                      <ChannelIcon type={conv.channel} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm font-semibold truncate text-text-primary`}>{contact.firstName} {contact.lastName}</h4>
                      <span className="text-xs text-text-secondary flex-shrink-0 ml-2">{new Date(conv.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-xs truncate text-text-secondary`}>
                        {latestMessage?.content || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )})}
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
                {activeConversation.contact.firstName.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold">{activeConversation.contact.firstName} {activeConversation.contact.lastName}</h3>
                <p className="text-xs text-text-secondary flex items-center gap-1">
                  <ChannelIcon type={activeConversation.channel} className="w-3 h-3" />
                  Replying via {activeConversation.channel.charAt(0).toUpperCase() + activeConversation.channel.slice(1)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon"><Search className="w-5 h-5 text-text-secondary" /></Button>
              <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5 text-text-secondary" /></Button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
            <div className="flex justify-center">
              <span className="text-xs bg-bg-secondary px-3 py-1 rounded-full text-text-secondary">Today</span>
            </div>
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isOutbound ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.isOutbound ? 'bg-primary text-white rounded-tr-sm' : 'bg-bg-secondary text-text-primary rounded-tl-sm'}`}>
                  <p className="text-sm">{msg.content}</p>
                  <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${msg.isOutbound ? 'text-primary-100' : 'text-text-secondary'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    {msg.isOutbound && <CheckCheck className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Suggestions */}
          <div className="px-6 py-2 flex gap-2">
            <Badge variant="outline" className="cursor-pointer hover:bg-bg-secondary bg-bg-primary" onClick={() => setNewMessage("Can we schedule a call?")}>Can we schedule a call?</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-bg-secondary bg-bg-primary" onClick={() => setNewMessage("I'll send over the contract.")}>I'll send over the contract.</Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-bg-secondary bg-primary/5 text-primary border-primary/20"
              onClick={handleAiReply}
            >
              {isAiLoading ? "Generating..." : "✨ Generate AI Reply"}
            </Badge>
          </div>

          {/* Chat Composer */}
          <div className="p-4 bg-bg-primary border-t border-border">
            <div className="bg-bg-secondary rounded-xl p-2">
              <textarea 
                className="w-full bg-transparent border-none resize-none focus:ring-0 text-sm p-2 outline-none"
                placeholder="Type your message..."
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
                <Button size="sm" className="gap-2" onClick={handleSendMessage} disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send'} <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-secondary">
              Select a conversation to start chatting.
            </div>
          )}
        </div>

        {/* Right Sidebar - Contact Details */}
        <div className="w-72 flex-shrink-0 border-l border-border bg-bg-primary hidden lg:flex flex-col overflow-y-auto">
          {activeConversation && (
            <>
          <div className="p-6 text-center border-b border-border">
            <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-3xl mx-auto mb-4">
              {activeConversation.contact.firstName?.charAt(0) || "U"}
            </div>
            <h2 className="text-xl font-semibold mb-1">{activeConversation.contact.firstName} {activeConversation.contact.lastName}</h2>
            <p className="text-sm text-text-secondary mb-4">{activeConversation.contact.company || "No Company"}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" className="w-full">View Profile</Button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Contact Info</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-text-secondary" />
                  <span className="truncate">{activeConversation.contact.email || "No Email"}</span>
                </div>
                {activeConversation.contact.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-text-secondary" />
                  <span>{activeConversation.contact.phone}</span>
                </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Hot Lead</Badge>
                <Badge variant="outline">Q3 Pipeline</Badge>
                <Badge variant="outline" className="border-dashed"><Plus className="w-3 h-3 mr-1" /> Add Tag</Badge>
              </div>
            </div>
          </div>
          </>
          )}
        </div>
        
      </div>
    </div>
  )
}

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
