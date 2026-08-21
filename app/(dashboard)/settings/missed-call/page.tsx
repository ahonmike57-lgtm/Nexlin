"use client"

import { useState, useEffect } from "react"
import { getMissedCallSettings, updateMissedCallSettings, testMissedCallTextBack } from "@/app/actions/missed-call"
import { toast } from "sonner"
import { PhoneMissed, MessageSquare, Sparkles, Send, Clock, ShieldCheck, Check, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function MissedCallTextBackPage() {
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState("Hi, this is [Agency Name]. We missed your call, how can we help?")
  const [aiFollowUp, setAiFollowUp] = useState(true)
  const [delaySeconds, setDelaySeconds] = useState(15)
  const [workingHoursOnly, setWorkingHoursOnly] = useState(false)
  const [agencyName, setAgencyName] = useState("Our Agency")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Simulator state
  const [testPhone, setTestPhone] = useState("")
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    const res = await getMissedCallSettings()
    if (res.success && res.data) {
      setEnabled(res.data.enabled)
      setMessage(res.data.message)
      setAiFollowUp(res.data.aiFollowUp)
      setAgencyName(res.data.agencyName)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await updateMissedCallSettings({
      enabled,
      message,
      aiFollowUp,
    })
    setSaving(false)
    if (res.success) {
      toast.success("Missed-Call Text-Back settings saved successfully!")
    } else {
      toast.error(res.error || "Failed to save settings")
    }
  }

  const handleTest = async () => {
    if (!testPhone.trim()) {
      toast.error("Please enter a test phone number")
      return
    }
    setTesting(true)
    const res = await testMissedCallTextBack(testPhone)
    setTesting(false)
    if (res.success) {
      toast.success(`Test SMS dispatched to ${testPhone}!`)
    } else {
      toast.error(res.error || "Test dispatch failed")
    }
  }

  const previewMessage = message.replace(/\[Agency Name\]/g, agencyName || "Our Agency")

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <PhoneMissed className="w-6 h-6 text-primary" />
            Missed-Call Text-Back
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Automatically recapture leads with instant SMS when an incoming call goes unanswered.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Settings */}
        <div className="md:col-span-2 space-y-5">
          {/* Master Toggle Card */}
          <div className="bg-bg-primary border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Enable Missed-Call Text-Back</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Trigger automatic SMS within seconds of an unanswered call
                </p>
              </div>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enabled ? "bg-primary" : "bg-bg-secondary border border-border"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* SMS Template Builder */}
          <div className="bg-bg-primary border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              SMS Message Template
            </h3>

            <div>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider block mb-1.5">
                Message Body
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono"
                placeholder="Enter SMS template..."
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center text-xs">
              <span className="text-text-secondary">Insert Tag:</span>
              <button
                onClick={() => setMessage((prev) => prev + " [Agency Name]")}
                className="px-2 py-1 rounded bg-bg-secondary border border-border hover:border-primary/40 text-text-primary"
              >
                + [Agency Name]
              </button>
              <button
                onClick={() => setMessage((prev) => prev + " [First Name]")}
                className="px-2 py-1 rounded bg-bg-secondary border border-border hover:border-primary/40 text-text-primary"
              >
                + [First Name]
              </button>
            </div>
          </div>

          {/* Automation Rules */}
          <div className="bg-bg-primary border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Smart Automation Rules
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <div>
                  <p className="text-xs font-medium text-text-primary">AI Autonomous Follow-Up</p>
                  <p className="text-[11px] text-text-secondary">
                    Let AI reply conversationally if the customer answers the text-back SMS
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={aiFollowUp}
                  onChange={(e) => setAiFollowUp(e.target.checked)}
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-medium text-text-primary">Working Hours Filter</p>
                  <p className="text-[11px] text-text-secondary">
                    Only trigger during office hours (Mon-Fri 9am-6pm)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={workingHoursOnly}
                  onChange={(e) => setWorkingHoursOnly(e.target.checked)}
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Mobile Preview & Tester */}
        <div className="space-y-5">
          {/* Mobile Preview */}
          <div className="bg-bg-primary border border-border rounded-xl p-5 shadow-sm space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Customer Mobile Preview
            </p>
            
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-white space-y-3">
              <div className="flex items-center justify-center text-[10px] text-slate-400">
                Today · Text Message
              </div>
              <div className="bg-primary text-white p-3 rounded-2xl rounded-tl-none text-xs leading-relaxed max-w-[90%] shadow-sm">
                {previewMessage}
              </div>
              {aiFollowUp && (
                <div className="text-[10px] text-slate-400 italic text-center">
                  ✦ AI Receptionist active on reply
                </div>
              )}
            </div>
          </div>

          {/* Test Simulator */}
          <div className="bg-bg-primary border border-border rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Live Test Simulator
            </h4>
            <p className="text-xs text-text-secondary">
              Dispatch a test text-back SMS to your personal mobile number.
            </p>
            <input
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+1234567890"
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleTest}
              disabled={testing || !testPhone.trim()}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-bg-secondary border border-border text-xs font-medium text-text-primary hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-40"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send Test SMS
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
