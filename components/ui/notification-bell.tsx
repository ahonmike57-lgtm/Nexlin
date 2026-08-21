"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Bell, X, Zap, UserPlus, FileText, Star, Mail, Flame, Calendar, Info } from "lucide-react"
import PusherClient from "pusher-js"
import { toast } from "sonner"
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions/notifications"

type Notification = {
  id: string
  type: string
  title: string
  body: string
  time: Date
  read: boolean
  link?: string | null
}

const iconMap: Record<string, any> = {
  automation: Zap,
  new_contact: UserPlus,
  lead_created: UserPlus,
  form_submission: FileText,
  review: Star,
  message: Mail,
  trigger_link_clicked: Flame,
  appointment_booked: Calendar,
  system: Info,
}

const colorMap: Record<string, string> = {
  automation: "text-primary bg-primary/10",
  new_contact: "text-emerald-500 bg-emerald-500/10",
  lead_created: "text-emerald-500 bg-emerald-500/10",
  form_submission: "text-amber-500 bg-amber-500/10",
  review: "text-yellow-500 bg-yellow-500/10",
  message: "text-blue-500 bg-blue-500/10",
  trigger_link_clicked: "text-orange-500 bg-orange-500/10",
  appointment_booked: "text-indigo-500 bg-indigo-500/10",
  system: "text-text-secondary bg-bg-secondary",
}

export default function NotificationBell({ agencyId }: { agencyId?: string }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch initial notifications from database
  useEffect(() => {
    setMounted(true)
    async function loadNotifications() {
      try {
        const res: any = await getNotifications()
        const notifList = res?.notifications || res?.data?.notifications
        if (Array.isArray(notifList)) {
          setNotifications(
            notifList.map((n: any) => ({
              id: n.id,
              type: n.type || "system",
              title: n.title,
              body: n.body,
              time: new Date(n.createdAt),
              read: n.read,
              link: n.link,
            }))
          )
        }
      } catch (e) {
        console.warn("Failed to load notifications from database:", e)
      }
    }
    loadNotifications()
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  // Position dropdown
  const updatePosition = () => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setDropdownPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    })
  }

  const toggleOpen = () => {
    if (!open) updatePosition()
    setOpen((o) => !o)
  }

  // Close handlers
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    return () => {
      window.removeEventListener("scroll", close, true)
      window.removeEventListener("resize", close)
    }
  }, [open])

  // Subscribe to Pusher for live real-time notifications
  useEffect(() => {
    if (!agencyId || !process.env.NEXT_PUBLIC_PUSHER_KEY) return
    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
    })
    const channel = pusher.subscribe(`agency-${agencyId}`)
    channel.bind("new-notification", (data: any) => {
      setNotifications((prev) => [
        {
          id: data.id || String(Date.now()),
          type: data.type || "system",
          title: data.title,
          body: data.body,
          time: new Date(data.createdAt || Date.now()),
          read: false,
          link: data.link,
        },
        ...prev,
      ].slice(0, 30))

      toast(data.title, {
        description: data.body,
        duration: 5000,
      })
    })

    return () => {
      pusher.unsubscribe(`agency-${agencyId}`)
    }
  }, [agencyId])

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await markAllNotificationsAsRead().catch(() => {})
  }

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    await markNotificationAsRead(id).catch(() => {})
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

  const dropdown = (
    <div
      ref={dropdownRef}
      style={{ top: dropdownPos.top, right: dropdownPos.right, position: "fixed" }}
      className="w-84 bg-bg-primary border border-border rounded-xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-secondary/50">
        <h3 className="font-semibold text-sm text-text-primary">Notifications</h3>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline font-medium">
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
            const Icon = iconMap[notif.type] || Info
            const color = colorMap[notif.type] || colorMap.system
            return (
              <div
                key={notif.id}
                onClick={() => handleMarkRead(notif.id)}
                className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-bg-secondary ${
                  !notif.read ? "bg-primary/5" : ""
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-semibold ${!notif.read ? "text-text-primary" : "text-text-secondary"}`}>
                      {notif.title}
                    </p>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2 mt-0.5">{notif.body}</p>
                  <p className="text-[10px] text-text-secondary mt-1">{formatTime(notif.time)}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-text-secondary hover:text-primary transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error rounded-full text-white text-[9px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && mounted && createPortal(dropdown, document.body)}
    </div>
  )
}
