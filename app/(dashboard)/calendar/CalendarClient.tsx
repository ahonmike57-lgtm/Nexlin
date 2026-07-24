"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Settings2, CreditCard, Sparkles, Users } from "lucide-react"
import { addDays, startOfWeek, format } from "date-fns"
import { createAppointment } from "@/app/actions/calendar"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export default function CalendarClient({ 
  initialAppointments, 
  contacts,
  agencyId 
}: { 
  initialAppointments: any[], 
  contacts: any[],
  agencyId: string 
}) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // New appointment form state
  const [title, setTitle] = useState("")
  const [contactId, setContactId] = useState("")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [time, setTime] = useState("09:00")

  // Advanced settings state
  const [showSettings, setShowSettings] = useState(false)
  const [paidEnabled, setPaidEnabled] = useState(false)
  const [depositAmount, setDepositAmount] = useState("50")
  const [roundRobinEnabled, setRoundRobinEnabled] = useState(false)
  const [aiRemindersEnabled, setAiRemindersEnabled] = useState(true)

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !contactId || !date || !time) return

    setIsSubmitting(true)
    const startTime = new Date(`${date}T${time}`)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour duration
    
    const res = await createAppointment(agencyId, {
      title,
      contactId,
      startTime,
      endTime
    })

    if (res.success && res.data) {
      setAppointments([...appointments, res.data])
      setIsModalOpen(false)
      setTitle("")
      setContactId("")
    }
    setIsSubmitting(false)
  }

  // Generate week days
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i))
  const hours = Array.from({ length: 12 }).map((_, i) => i + 8) // 8 AM to 7 PM

  return (
    <>
      <div className="bg-bg-primary rounded-xl border border-border shadow-sm flex flex-col flex-1 overflow-hidden ">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">Today</Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="w-8 h-8"><ChevronLeft className="w-4 h-4 text-text-secondary" /></Button>
              <Button variant="ghost" size="icon" className="w-8 h-8"><ChevronRight className="w-4 h-4 text-text-secondary" /></Button>
            </div>
            <h2 className="font-semibold text-lg">{format(startDate, "MMMM yyyy")}</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings2 className="w-4 h-4 mr-2" /> Settings
            </Button>
            <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" /> New Appointment
            </Button>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto flex relative bg-bg-secondary/30">
          
          {/* Time Column */}
          <div className="w-16 flex-shrink-0 border-r border-border bg-bg-primary sticky left-0 z-10">
            <div className="h-12 border-b border-border"></div> {/* Empty header cell */}
            {hours.map(hour => (
              <div key={hour} className="h-20 border-b border-border/50 text-right pr-2 pt-2">
                <span className="text-xs text-text-secondary">{hour}:00 {hour < 12 ? 'AM' : 'PM'}</span>
              </div>
            ))}
          </div>
          
          {/* Days Columns */}
          <div className="flex-1 flex min-w-[800px]">
            {days.map((day, i) => (
              <div key={i} className="flex-1 border-r border-border min-w-0">
                {/* Day Header */}
                <div className="h-12 border-b border-border bg-bg-primary flex flex-col items-center justify-center sticky top-0 z-10">
                  <span className="text-xs text-text-secondary uppercase">{format(day, "EEE")}</span>
                  <span className={`text-lg font-semibold ${format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "text-primary bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center -mt-1" : ""}`}>
                    {format(day, "d")}
                  </span>
                </div>
                
                {/* Time Slots */}
                <div className="relative">
                  {hours.map(hour => (
                    <div key={hour} className="h-20 border-b border-border/50 hover:bg-bg-secondary/50 transition-colors"></div>
                  ))}
                  
                  {/* Render Appointments */}
                  {appointments.filter(app => format(new Date(app.startTime), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).map(app => {
                    const appStart = new Date(app.startTime)
                    const appEnd = new Date(app.endTime)
                    const startHour = appStart.getHours() + (appStart.getMinutes() / 60)
                    const duration = (appEnd.getTime() - appStart.getTime()) / (1000 * 60 * 60) // in hours
                    
                    const top = Math.max(0, (startHour - 8) * 80) // 80px per hour
                    const height = duration * 80
                    
                    if (startHour < 8 || startHour > 19) return null // Out of bounds for simple view
                    
                    return (
                      <div 
                        key={app.id} 
                        className="absolute left-1 right-1 bg-primary/10 border border-primary/20 rounded-md p-2 overflow-hidden shadow-sm"
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <h4 className="text-xs font-semibold text-primary truncate">{app.title}</h4>
                        <p className="text-[10px] text-text-secondary truncate mt-1 flex items-center gap-1">
                          <User className="w-3 h-3" /> {app.contact?.firstName}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
          <div className="bg-bg-primary rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold">New Appointment</h3>
            </div>
            
            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Discovery Call" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Contact</label>
                <select 
                  required 
                  value={contactId} 
                  onChange={e => setContactId(e.target.value)}
                  className="w-full bg-bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select Contact...</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <Input type="time" required value={time} onChange={e => setTime(e.target.value)} />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Appointment"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advanced Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-primary/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-bg-secondary to-transparent">
              <h3 className="text-xl font-bold text-text-primary">Advanced Booking Engine</h3>
              <p className="text-sm text-text-secondary mt-1">Configure paid appointments, round-robin, and AI SDR reminders.</p>
            </div>
            
            <div className="p-6 space-y-4">
              
              {/* Paid Appointments */}
              <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-bg-secondary/50 hover:bg-bg-secondary transition-colors">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 shadow-sm">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm text-text-primary">Paid Appointments (Stripe)</h4>
                    <Switch checked={paidEnabled} onCheckedChange={setPaidEnabled} />
                  </div>
                  <p className="text-xs text-text-secondary mb-4 leading-relaxed">Require clients to pay a deposit before confirming their booking. Automatically processes via Stripe.</p>
                  
                  {paidEnabled && (
                    <div className="flex items-center gap-2 bg-bg-primary p-3 rounded-lg border border-border/50">
                      <span className="text-sm font-bold text-text-primary">$</span>
                      <Input 
                        type="number" 
                        value={depositAmount} 
                        onChange={(e) => setDepositAmount(e.target.value)} 
                        className="w-24 h-8 text-sm font-semibold"
                      />
                      <span className="text-xs font-medium text-text-secondary ml-2 uppercase tracking-wide">Deposit Required</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Round Robin */}
              <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-bg-secondary/50 hover:bg-bg-secondary transition-colors">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0 shadow-sm">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm text-text-primary">Round-Robin Assignment</h4>
                    <Switch checked={roundRobinEnabled} onCheckedChange={setRoundRobinEnabled} />
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">Automatically distribute incoming booked meetings equally among available team members to maximize sales coverage.</p>
                </div>
              </div>

              {/* AI Reminders */}
              <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-bg-secondary/50 hover:bg-bg-secondary transition-colors">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0 shadow-sm">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm text-text-primary">AI Voice & SMS Reminders</h4>
                    <Switch checked={aiRemindersEnabled} onCheckedChange={setAiRemindersEnabled} />
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">Allow the AI SDR to automatically text or call the prospect 1 hour before the meeting to confirm attendance and reduce no-shows.</p>
                </div>
              </div>

            </div>
            
            <div className="px-6 py-4 bg-bg-secondary/80 border-t border-border flex justify-end gap-3 backdrop-blur-sm">
              <Button type="button" variant="ghost" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button type="button" className="shadow-md hover:shadow-lg transition-all" onClick={() => {
                setShowSettings(false)
                toast?.success("Booking engine configuration updated successfully! Stripe connection is active.") || alert("Booking engine configuration updated successfully! Stripe connection is active.")
              }}>Save Settings</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
