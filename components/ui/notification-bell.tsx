"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, Zap, UserPlus, FileText, Star, Mail } from "lucide-react"
import PusherClient from "pusher-js"

type Notification = {
  id: string
  type: "automation" | "new_contact" | "form_submission" | "review" | "message"
  title: string
  body: string
  time: Date
  read: boolean
}

const iconMap = {
  automation: Zap,
  new_contact: UserPlus,
  form_submission: FileText,
  review: Star,
  message: Mail,
}

const colorMap = {
  automation: "text-primary bg-primary/10",
  new_contact: "text-success bg-success/10",
  form_submission: "text-warning bg-warning/10",
  review: "text-yellow-500 bg-yellow-500/10",
  message: "text-secondary bg-secondary/10",
}

// Seed initial notifications on first render
const seedNotifications = (): Notification[] => [
  {
    id: "1",
    type: "automation",
    title: "Automation Triggered",
    body: "\"Welcome Email\" workflow ran for 3 contacts.",
    time: new Date(Date.now() - 2 * 60 * 1000),
    read: false,
  },
  {
    id: "2",
    type: "new_contact",
    title: "New Contact",
    body: "James Okafor was added via website form.",
    time: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
  },
  {
    id: "3",
    type: "review",
    title: "New 5★ Review",
    body: "Adaeze left a 5-star review on Google.",
    time: new Date(Date.now() - 60 * 60 * 1000),
    read: true,
  },
]

export default function NotificationBell({ agencyId }: { agencyId?: string }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(seedNotifications)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Subscribe to Pusher for real-time notifications
  useEffect(() => {
    if (!agencyId || !process.env.NEXT_PUBLIC_PUSHER_KEY) return

    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
    })

    const channel = pusher.subscribe(`agency-${agencyId}`)

    channel.bind("notification", (data: Omit<Notification, "read">) => {
      setNotifications(prev => [{ ...data, read: false }, ...prev].slice(0, 20))
    })

    return () => {
      pusher.unsubscribe(`agency-${agencyId}`)
    }
  }, [agencyId])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="relative z-[100]" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-text-secondary hover:text-primary transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error rounded-full text-white text-[9px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-bg-primary border border-border rounded-xl shadow-2xl z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-text-secondary hover:text-text-primary" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-text-secondary text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = iconMap[notif.type]
                const color = colorMap[notif.type]
                return (
                  <div
                    key={notif.id}
                    onClick={() => markRead(notif.id)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-bg-secondary ${!notif.read ? "bg-primary/3" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!notif.read ? "text-text-primary" : "text-text-secondary"}`}>
                          {notif.title}
                        </p>
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-text-secondary truncate">{notif.body}</p>
                      <p className="text-[10px] text-text-secondary mt-1">{formatTime(notif.time)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
