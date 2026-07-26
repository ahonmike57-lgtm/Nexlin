"use client"

import { useState } from "react"
import { interruptAiChatAndTakeover } from "@/app/actions/ai-supervisor"
import { Button } from "@/components/ui/button"
import { ShieldAlert, UserCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function AiSupervisorModal({ conversationId }: { conversationId: string }) {
  const [open, setOpen] = useState(false)
  const [takingOver, setTakingOver] = useState(false)
  const [note, setNote] = useState("")

  const handleTakeover = async () => {
    setTakingOver(true)
    const res = await interruptAiChatAndTakeover(conversationId, note)
    if (res.success) {
      toast.success("Human supervisor takeover complete — AI paused for this chat!")
      setOpen(false)
      setNote("")
    } else {
      toast.error(res.error || "Takeover failed")
    }
    setTakingOver(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10">
          <ShieldAlert className="w-4 h-4 mr-1.5" /> Human Takeover
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] bg-bg-primary border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <UserCheck className="w-5 h-5" /> Interrupt AI & Take Over Chat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-xs text-text-secondary">
            Instantly pause the AI agent for this conversation and assign manual response control to your agent seat.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-medium">Supervisor Internal Note (Optional)</label>
            <textarea
              className="w-full h-16 p-2 text-xs bg-bg-secondary border border-border rounded-lg"
              placeholder="e.g. Lead requested custom pricing quote..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleTakeover} disabled={takingOver} className="bg-amber-500 hover:bg-amber-600 text-white">
              {takingOver ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Confirm Human Takeover
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
