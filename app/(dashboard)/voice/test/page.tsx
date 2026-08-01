"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mic, MicOff, Volume2, Sparkles, PhoneCall, ArrowLeft, Bot, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function VoiceSimulatorPage() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [callStatus, setCallStatus] = useState<"idle" | "connected" | "speaking" | "ended">("idle")

  const samplePrompts = [
    "Hi, I'm calling about the 2021 Silverado. Is it available?",
    "Can I schedule a test drive for tomorrow at 2 PM?",
    "What are your financing options for bad credit?"
  ]

  const handleStartCall = () => {
    setCallStatus("connected")
    setAiResponse("Hello! Thanks for calling Acme Dealership Partners. How can I help you today?")
    speakText("Hello! Thanks for calling Acme Dealership Partners. How can I help you today?")
  }

  const handleEndCall = () => {
    setCallStatus("ended")
    setIsListening(false)
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
  }

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.onstart = () => setCallStatus("speaking")
      utterance.onend = () => setCallStatus("connected")
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleSimulateUserInput = (userText: string) => {
    setTranscript(userText)
    setIsProcessing(true)
    setTimeout(() => {
      let reply = "I can definitely help with that! Let me check our available inventory and schedule a test drive."
      if (userText.toLowerCase().includes("silverado")) {
        reply = "Yes! The 2021 Chevy Silverado is in stock at $34,900 with 28,000 miles. Would you like me to send photos to your mobile number?"
      } else if (userText.toLowerCase().includes("financing")) {
        reply = "We offer 100% guaranteed approval programs regardless of credit score! Would you like to complete a 60-second pre-approval?"
      }
      setAiResponse(reply)
      setIsProcessing(false)
      speakText(reply)
    }, 1200)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/voice" className="p-2 rounded-lg border border-border hover:bg-bg-secondary text-text-secondary">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Voice Agent Simulator</h1>
            <p className="text-sm text-text-secondary">Test conversational voice responses live in browser.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {callStatus === "idle" || callStatus === "ended" ? (
            <Button onClick={handleStartCall} className="gap-2 bg-success text-white hover:bg-success/90">
              <PhoneCall className="w-4 h-4" /> Start Simulator Call
            </Button>
          ) : (
            <Button onClick={handleEndCall} variant="outline" className="gap-2 border-red-500 text-red-500 hover:bg-red-500/10">
              <PhoneCall className="w-4 h-4" /> End Call
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" /> Live Audio Stream
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-primary/10 text-primary uppercase font-bold">
                {callStatus}
              </span>
            </CardTitle>
            <CardDescription>Speak or select a sample customer query below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="min-h-[160px] p-4 rounded-xl bg-bg-secondary/50 border border-border flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider block mb-1">Customer Input</span>
                <p className="text-sm font-medium">{transcript || "Waiting for user speech..."}</p>
              </div>

              <div className="pt-4 border-t border-border/50">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Voice Agent Output
                </span>
                <p className="text-sm text-text-primary font-medium">{isProcessing ? "AI Agent is thinking..." : aiResponse || "Call started."}</p>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-text-secondary block mb-2">Simulate Sample Customer Queries:</span>
              <div className="flex flex-col gap-2">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    disabled={callStatus === "idle" || callStatus === "ended" || isProcessing}
                    onClick={() => handleSimulateUserInput(p)}
                    className="text-left px-3.5 py-2.5 rounded-lg border border-border bg-bg-primary hover:bg-bg-secondary text-xs transition-colors disabled:opacity-40"
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="space-y-4">
          <CardHeader>
            <CardTitle className="text-base">Agent Status</CardTitle>
            <CardDescription>Live parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-bg-secondary flex justify-between">
              <span className="text-text-secondary">Latency</span>
              <span className="font-mono font-bold text-success">380 ms</span>
            </div>
            <div className="p-3 rounded-lg bg-bg-secondary flex justify-between">
              <span className="text-text-secondary">Audio Codec</span>
              <span className="font-mono font-bold">Opus / WebRTC</span>
            </div>
            <div className="p-3 rounded-lg bg-bg-secondary flex justify-between">
              <span className="text-text-secondary">Voice Profile</span>
              <span className="font-mono font-bold">Rachel (Natural)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
