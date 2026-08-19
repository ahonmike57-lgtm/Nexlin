"use client"

import { useState, useEffect, useRef } from "react"
import { Sparkles, Loader2, Send, Mic, MicOff } from "lucide-react"
import { generateAiReply } from "@/app/actions/ai"
import { createContact } from "@/app/actions/contacts"
import { toast } from "sonner"
import { Dialog, DialogContent } from "@/components/ui/dialog"

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function AskAiCommandBar() {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Stop listening when dialog closes
  useEffect(() => {
    if (!open && listening) {
      recognitionRef.current?.stop()
      setListening(false)
    }
  }, [open, listening])

  const toggleVoice = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRec) {
      toast.error("Speech recognition not supported in this browser")
      return
    }

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const rec = new SpeechRec()
    rec.lang = "en-US"
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e: any) => {
      const transcript: string = e.results[0][0].transcript
      setPrompt((prev) => (prev ? prev + " " + transcript : transcript))
      toast.success(`Voice captured: "${transcript}"`)
    }
    rec.onerror = () => {
      toast.error("Voice recognition error")
      setListening(false)
    }
    rec.onend = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
    setListening(true)
    toast.info("Listening… speak now")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setLoading(true)
    try {
      const aiRes = await generateAiReply(
        "",
        `The user typed a command into the platform command bar: "${prompt}". Interpret the command and return a JSON action with keys "action" (e.g. "create_contact", "general_answer"), "data" (object with extracted parameters like firstName, email, phone if creating contact), and "message" (string explanation).`
      )

      if (aiRes.success && aiRes.data) {
        try {
          const parsed = JSON.parse(aiRes.data.replace(/```json|```/g, "").trim())

          if (parsed.action === "create_contact" && parsed.data) {
            const res = await createContact(parsed.data)
            if (res.success) {
              toast.success(`Created contact ${parsed.data.firstName || "Lead"}`)
            }
          } else {
            toast.info(parsed.message || "Command processed")
          }
        } catch {
          toast.info(aiRes.data)
        }
      }
      setPrompt("")
      setOpen(false)
    } catch {
      toast.error("Failed to execute command")
    }
    setLoading(false)
  }

  return (
    <>
      {/* Trigger Chip */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-bg-secondary/70 hover:bg-bg-secondary border border-border rounded-lg text-xs text-text-secondary transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
        <span>Ask AI Command...</span>
        <kbd className="ml-2 px-1.5 py-0.5 rounded bg-bg-primary text-[10px] font-mono border border-border">⌘K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 bg-bg-primary border-border overflow-hidden">
          <form onSubmit={handleSubmit} className="flex items-center p-3 border-b border-border bg-bg-secondary/30">
            <Sparkles className="w-5 h-5 text-primary ml-2 flex-shrink-0" />
            <input
              className="flex-1 px-3 py-2 text-sm bg-transparent border-none focus:outline-none text-text-primary placeholder:text-text-secondary"
              placeholder="e.g. Create contact Sarah Jenkins, email sarah@acme.com..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              autoFocus
            />
            {/* Voice-to-Vibe mic button */}
            <button
              type="button"
              onClick={toggleVoice}
              title={listening ? "Stop listening" : "Voice input (Voice-to-Vibe)"}
              className={`p-2 rounded-lg mr-1 transition-colors ${
                listening
                  ? "bg-error/10 text-error animate-pulse"
                  : "text-text-secondary hover:text-primary hover:bg-primary/10"
              }`}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="p-2 rounded-lg bg-primary text-white disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          <div className="p-3 bg-bg-secondary/50 text-[11px] text-text-secondary flex justify-between items-center">
            <span>Type or speak any command in plain English</span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> Voice-to-Vibe</span>
              <span className="font-mono">ESC to close</span>
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
