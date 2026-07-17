"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Phone, Plus, Upload, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { buyPhoneNumber, submitPortRequest } from "@/app/actions/telephony"
import { toast } from "sonner"

export default function PhoneNumbersClient({ 
  initialNumbers, 
  initialPortRequests, 
  agencyId 
}: { 
  initialNumbers: any[], 
  initialPortRequests: any[], 
  agencyId: string 
}) {
  const [activeTab, setActiveTab] = useState("active")
  const [numbers, setNumbers] = useState(initialNumbers)
  const [portRequests, setPortRequests] = useState(initialPortRequests)
  
  const [isBuying, setIsBuying] = useState(false)
  const [isPorting, setIsPorting] = useState(false)
  const [portForm, setPortForm] = useState({
    numberToPort: "",
    currentCarrier: "",
    accountNumber: "",
    accountPin: ""
  })

  const handleBuyNumber = async () => {
    setIsBuying(true)
    try {
      const res = await buyPhoneNumber(agencyId, "415")
      if (res.success) {
        toast.success("Successfully purchased new number!")
        setNumbers([...numbers, res.data])
      } else {
        toast.error("Failed to buy number.")
      }
    } catch (e) {
      toast.error("An error occurred.")
    }
    setIsBuying(false)
  }

  const handlePortRequest = async () => {
    if (!portForm.numberToPort || !portForm.currentCarrier) {
      toast.error("Please fill in required fields.")
      return
    }
    setIsPorting(true)
    try {
      const res = await submitPortRequest(agencyId, portForm)
      if (res.success) {
        toast.success("Port request submitted successfully!")
        setPortRequests([...portRequests, res.data])
        setActiveTab("porting")
        setPortForm({
          numberToPort: "",
          currentCarrier: "",
          accountNumber: "",
          accountPin: ""
        })
      } else {
        toast.error("Failed to submit port request.")
      }
    } catch (e) {
      toast.error("An error occurred.")
    }
    setIsPorting(false)
  }

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Phone Numbers</h2>
          <p className="text-text-secondary">Manage your active numbers and call porting requests.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab("new-port")}>
            <Upload className="w-4 h-4 mr-2" /> Port Number
          </Button>
          <Button onClick={handleBuyNumber} disabled={isBuying}>
            {isBuying ? "Processing..." : <><Plus className="w-4 h-4 mr-2" /> Buy Number</>}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        <button
          className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          onClick={() => setActiveTab("active")}
        >
          Active Numbers
        </button>
        <button
          className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'porting' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          onClick={() => setActiveTab("porting")}
        >
          Porting Requests
        </button>
      </div>

      {activeTab === "active" && (
        <div className="flex-1 bg-bg-secondary rounded-xl border border-border p-6">
          {numbers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Phone className="w-12 h-12 text-text-secondary mb-4" />
              <h3 className="text-lg font-medium mb-1">No phone numbers</h3>
              <p className="text-sm text-text-secondary mb-4">You haven't added any phone numbers to your agency yet.</p>
              <Button onClick={handleBuyNumber} disabled={isBuying}>Buy a Number</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {numbers.map((n: any) => (
                <div key={n.id} className="flex items-center justify-between p-4 bg-bg-primary rounded-lg border border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">{n.number}</p>
                      <p className="text-xs text-text-secondary capitalize">Provider: {n.provider}</p>
                    </div>
                  </div>
                  <div>
                    {n.status === "active" ? (
                      <Badge className="bg-success/10 text-success hover:bg-success/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-text-secondary"><Clock className="w-3 h-3 mr-1" /> Porting In</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "porting" && (
        <div className="flex-1 bg-bg-secondary rounded-xl border border-border p-6">
          {portRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Upload className="w-12 h-12 text-text-secondary mb-4" />
              <h3 className="text-lg font-medium mb-1">No port requests</h3>
              <p className="text-sm text-text-secondary mb-4">You have no pending port requests.</p>
              <Button onClick={() => setActiveTab("new-port")}>Port a Number</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {portRequests.map((r: any) => (
                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-bg-primary rounded-lg border border-border gap-4">
                  <div>
                    <p className="font-medium">{r.numberToPort}</p>
                    <p className="text-xs text-text-secondary">From: {r.currentCarrier}</p>
                  </div>
                  <div>
                    {r.status === "pending" ? (
                      <Badge className="bg-warning/10 text-warning hover:bg-warning/20 border-warning/20"><Clock className="w-3 h-3 mr-1" /> Pending LOA</Badge>
                    ) : r.status === "approved" ? (
                      <Badge className="bg-success/10 text-success hover:bg-success/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>
                    ) : (
                      <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20"><AlertCircle className="w-3 h-3 mr-1" /> Rejected</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "new-port" && (
        <div className="flex-1 bg-bg-secondary rounded-xl border border-border p-6 max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">Submit a Port Request</h2>
          <p className="text-sm text-text-secondary mb-6">Porting a number to Nexlin allows you to use your existing business number for SMS and voice campaigns. The process typically takes 3-7 business days.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Number to Port *</label>
              <Input 
                placeholder="+1 (555) 000-0000" 
                value={portForm.numberToPort} 
                onChange={e => setPortForm({...portForm, numberToPort: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Current Carrier *</label>
              <Input 
                placeholder="e.g. AT&T, Verizon, RingCentral" 
                value={portForm.currentCarrier} 
                onChange={e => setPortForm({...portForm, currentCarrier: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Account Number</label>
                <Input 
                  placeholder="Carrier Account #" 
                  value={portForm.accountNumber} 
                  onChange={e => setPortForm({...portForm, accountNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PIN / Passcode</label>
                <Input 
                  placeholder="Carrier PIN" 
                  value={portForm.accountPin} 
                  onChange={e => setPortForm({...portForm, accountPin: e.target.value})}
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-border flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setActiveTab("active")}>Cancel</Button>
              <Button onClick={handlePortRequest} disabled={isPorting}>{isPorting ? "Submitting..." : "Submit Request"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
