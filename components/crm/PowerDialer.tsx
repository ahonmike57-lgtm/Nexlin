"use client"

import { useState } from "react"
import { Phone, PhoneOff, Play, SkipForward, Pause, CheckCircle2, User, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { sendSMS } from "@/app/actions/telephony"
import { toast } from "sonner"

export function PowerDialer({ contacts }: { contacts: any[] }) {
  const [active, setActive] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [calling, setCalling] = useState(false)
  const [callNote, setCallNote] = useState("")

  const queue = contacts.filter(c => c.phone)
  const currentContact = queue[currentIndex]

  if (!active) {
    return (
      <Button variant="outline" size="sm" onClick={() => setActive(true)} disabled={queue.length === 0}>
        <Phone className="w-4 h-4 mr-2 text-primary" /> Start Power Dialer ({queue.length})
      </Button>
    )
  }

  if (!currentContact) {
    return (
      <div className="fixed bottom-6 right-6 z-50 p-4 bg-bg-primary border border-border rounded-xl shadow-xl w-80 flex flex-col items-center text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-success" />
        <div>
          <h4 className="font-semibold text-text-primary">Power Dialer Queue Complete!</h4>
          <p className="text-xs text-text-secondary">You have completed dialing all queued contacts.</p>
        </div>
        <Button size="sm" onClick={() => { setActive(false); setCurrentIndex(0) }}>
          Close Dialer
        </Button>
      </div>
    )
  }

  const handleStartCall = () => {
    setCalling(true)
    toast.info(`Dialing ${currentContact.firstName || "Contact"} (${currentContact.phone})...`)
    // Simulation / Twilio Voice WebRTC bridge integration point
  }

  const handleEndCall = () => {
    setCalling(false)
    toast.success("Call ended")
  }

  const handleNext = () => {
    setCalling(false)
    setCallNote("")
    setCurrentIndex(prev => prev + 1)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 p-5 bg-bg-primary border border-border rounded-2xl shadow-2xl w-96 space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-primary">
            Power Dialer ({currentIndex + 1} of {queue.length})
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-text-secondary" onClick={() => setActive(false)}>
          ✕
        </Button>
      </div>

      {/* Current Contact Info Card */}
      <div className="p-3 bg-bg-secondary/60 rounded-xl space-y-1">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm text-text-primary">
            {currentContact.firstName} {currentContact.lastName}
          </span>
        </div>
        <div className="text-xs text-text-secondary font-mono pl-6">
          {currentContact.phone}
        </div>
        {currentContact.email && (
          <div className="text-xs text-text-secondary pl-6 truncate">
            {currentContact.email}
          </div>
        )}
      </div>

      {/* Quick Call Note */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-text-secondary flex items-center gap-1">
          <FileText className="w-3 h-3" /> Call Outcome / Note
        </label>
        <textarea
          placeholder="Log key notes during call..."
          className="w-full h-16 p-2 text-xs bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-primary"
          value={callNote}
          onChange={(e) => setCallNote(e.target.value)}
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {!calling ? (
          <Button className="flex-1 bg-success hover:bg-success/90 text-white" onClick={handleStartCall}>
            <Phone className="w-4 h-4 mr-2" /> Call Now
          </Button>
        ) : (
          <Button className="flex-1 bg-error hover:bg-error/90 text-white" onClick={handleEndCall}>
            <PhoneOff className="w-4 h-4 mr-2" /> Hang Up
          </Button>
        )}

        <Button variant="outline" onClick={handleNext}>
          <SkipForward className="w-4 h-4 mr-1" /> Skip Next
        </Button>
      </div>
    </div>
  )
}
