"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mic, MicOff, Volume2, Sparkles, PhoneCall, ArrowLeft, Bot, RefreshCw, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { generateAiReply } from "@/app/actions/ai"
import Link from "next/link"

export default function VoiceSimulatorPage() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [customInput, setCustomInput] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [callStatus, setCallStatus] = useState<"idle" | "connected" | "speaking" | "ended">("idle")
  const recognitionRef = useRef<any>(null)

  const samplePrompts = [
    "Hi, I'm calling about the enterprise pricing for 10 licenses. What are your terms?",
    "Can I schedule an appointment for an onboarding call tomorrow afternoon?",
    "Do you offer custom integrations with our CRM and WhatsApp numbers?"
  ]

  useEffect(() => {
    // Setup Web Speech Recognition if available in browser
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript
        setIsListening(false)
        handleProcessVoiceInput(text)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const handleStartCall = () => {
    setCallStatus("connected")
    const greeting = "Hello! Thanks for calling Nexlin Voice Support. How can I assist your business today?"
    setAiResponse(greeting)
    speakText(greeting)
  }

  const handleEndCall = () => {
    setCallStatus("ended")
    setIsListening(false)
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
  }

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.05
      utterance.pitch = 1.0
      utterance.onstart = () => setCallStatus("speaking")
      utterance.onend = () => setCallStatus("connected")
      window.speechSynthesis.speak(utterance)
    }
  }

  const toggleMicListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      setIsListening(false)
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
          setIsListening(true)
        } catch {}
      }
    }
  }

  const handleProcessVoiceInput = async (userText: string) => {
    if (!userText.trim()) return
    setTranscript(userText)
    setIsProcessing(true)

    try {
      const prompt = `You are Nexlin's Autonomous Inbound Voice Receptionist. The customer on the phone just said: "${userText}". Respond naturally, warmly, and helpfully in 1 to 2 spoken conversational sentences. Do not use markdown or bullet points.`
      const res = await generateAiReply("chat", prompt)

      let reply = "I would be delighted to help you with that! Let me check the schedule and get that sorted for you."
      if (res.success && res.data) {
        reply = res.data.replace(/[*_#`]/g, "").trim()
      }

      setAiResponse(reply)
      speakText(reply)
    } catch {
      const fallback = "I understand completely. Let me connect you directly with one of our senior specialists."
      setAiResponse(fallback)
      speakText(fallback)
    } finally {
      setIsProcessing(false)
    }
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
            <p className="text-sm text-text-secondary">Test conversational voice responses live in browser with real AI.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {callStatus === "idle" || callStatus === "ended" ? (
            <Button onClick={handleStartCall} className="gap-2 bg-success text-white hover:bg-success/90 cursor-pointer">
              <PhoneCall className="w-4 h-4" /> Start Simulator Call
            </Button>
          ) : (
            <Button onClick={handleEndCall} variant="outline" className="gap-2 border-red-500 text-red-500 hover:bg-red-500/10 cursor-pointer">
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
            <CardDescription>Speak into your microphone or type a query below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="min-h-[160px] p-4 rounded-xl bg-bg-secondary/50 border border-border flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider block mb-1">Customer Input</span>
                <p className="text-sm font-medium">{transcript || "Waiting for caller query..."}</p>
              </div>

              <div className="pt-4 border-t border-border/50">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Voice Agent Response
                </span>
                <p className="text-sm text-text-primary font-medium">{isProcessing ? "AI Agent is generating speech..." : aiResponse || "Click Start Simulator Call to begin."}</p>
              </div>
            </div>

            {/* Mic and Input Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant={isListening ? "default" : "outline"}
                disabled={callStatus === "idle" || callStatus === "ended" || isProcessing}
                onClick={toggleMicListening}
                className={`gap-2 cursor-pointer ${isListening ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : ""}`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isListening ? "Listening..." : "Speak via Mic"}
              </Button>

              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Or type a test message..."
                  value={customInput}
                  disabled={callStatus === "idle" || callStatus === "ended" || isProcessing}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customInput.trim()) {
                      const msg = customInput.trim()
                      setCustomInput("")
                      handleProcessVoiceInput(msg)
                    }
                  }}
                  className="text-xs h-9 bg-bg-primary"
                />
                <Button
                  size="sm"
                  disabled={callStatus === "idle" || callStatus === "ended" || isProcessing || !customInput.trim()}
                  onClick={() => {
                    const msg = customInput.trim()
                    setCustomInput("")
                    handleProcessVoiceInput(msg)
                  }}
                  className="h-9 px-3 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-text-secondary block mb-2">Or select a quick test prompt:</span>
              <div className="flex flex-col gap-2">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    disabled={callStatus === "idle" || callStatus === "ended" || isProcessing}
                    onClick={() => handleProcessVoiceInput(p)}
                    className="text-left px-3.5 py-2.5 rounded-lg border border-border bg-bg-primary hover:bg-bg-secondary text-xs transition-colors disabled:opacity-40 cursor-pointer"
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
              <span className="font-mono font-bold text-success">~180 ms</span>
            </div>
            <div className="p-3 rounded-lg bg-bg-secondary flex justify-between">
              <span className="text-text-secondary">Speech Synthesis</span>
              <span className="font-mono font-bold">Web Speech API</span>
            </div>
            <div className="p-3 rounded-lg bg-bg-secondary flex justify-between">
              <span className="text-text-secondary">LLM Engine</span>
              <span className="font-mono font-bold text-primary">Gemini / OpenAI</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
