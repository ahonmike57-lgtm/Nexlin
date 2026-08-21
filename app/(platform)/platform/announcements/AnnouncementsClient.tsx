"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Megaphone, Plus, CheckCircle2, Loader2, Power } from "lucide-react"
import { createPlatformAnnouncement, togglePlatformAnnouncement } from "@/app/actions/platform-admin"

interface Announcement {
  id: string
  title: string
  message: string
  type: string
  author: string
  isActive: boolean
  createdAt: Date
}

export function AnnouncementsClient({
  initialAnnouncements
}: {
  initialAnnouncements: Announcement[]
}) {
  const [items, setItems] = useState<Announcement[]>(initialAnnouncements)
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState("info")
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !message) return

    setIsLoading(true)
    try {
      const res = await createPlatformAnnouncement({
        title,
        message,
        type
      })

      if (res.success && res.data) {
        setItems([res.data as any, ...items])
        setIsOpen(false)
        setTitle("")
        setMessage("")
        setSuccessMessage("Global announcement broadcasted successfully!")
        setTimeout(() => setSuccessMessage(null), 4000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    const nextState = !currentActive
    setItems(items.map(item => item.id === id ? { ...item, isActive: nextState } : item))
    await togglePlatformAnnouncement(id, nextState)
  }

  return (
    <div className="space-y-8">
      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" /> {successMessage}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Global In-App Announcements</h1>
          <p className="text-sm text-text-secondary">Broadcast maintenance alerts, new features, and notices to all agency owners.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> New System Broadcast
        </Button>
      </div>

      <Card className="border border-border bg-bg-primary shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Active & Past Broadcasts</CardTitle>
          <CardDescription className="text-xs">Live banners displayed on tenant dashboard headers.</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-sm">
              <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
              No active announcements. Create one to notify all connected agencies.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((a) => (
                <div key={a.id} className="py-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary mt-0.5">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-text-primary">{a.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-bg-secondary text-text-secondary">
                          {a.type}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1">{a.message}</p>
                      <p className="text-[10px] text-text-secondary mt-2">
                        Posted by {a.author} · {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(a.id, a.isActive)}
                    className={`text-xs px-2.5 py-1 rounded-full font-bold transition-colors flex items-center gap-1.5 ${
                      a.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20" : "bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80"
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    {a.isActive ? "Live" : "Inactive"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Broadcast System Announcement</DialogTitle>
            <DialogDescription>
              This announcement will appear as a banner across all connected tenant agencies.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">Title</label>
              <Input 
                placeholder="e.g. Scheduled Maintenance Sunday at 2 AM EST"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">Banner Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="info">Information (Blue)</option>
                <option value="feature">New Feature (Purple)</option>
                <option value="warning">Warning / Maintenance (Amber)</option>
                <option value="urgent">Urgent Notice (Red)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">Message Content</label>
              <textarea 
                className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                placeholder="Details of the announcement or feature release..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Publish Broadcast
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
