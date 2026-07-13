"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import { Editor, Frame, Element, useNode } from "@craftjs/core"
import { updateFunnelStepContent } from "@/app/actions/funnels"

const TextComponent = ({ text }: { text: string }) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div ref={(ref: any) => connect(drag(ref))} className="p-4 bg-bg-secondary mb-2 rounded border border-border">
      <h2 className="text-xl font-bold">{text}</h2>
      <p className="text-sm text-text-secondary">Drag me around!</p>
    </div>
  )
}

const ContainerComponent = ({ children }: { children?: React.ReactNode }) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div ref={(ref: any) => connect(drag(ref))} className="p-8 bg-white border border-dashed border-primary/50 min-h-[200px] w-full">
      {children}
    </div>
  )
}

export default function FunnelBuilderClient({ funnel }: { funnel: any }) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!funnel.steps?.[0]) return
    setIsSaving(true)
    // CraftJS save logic would serialize state here
    await updateFunnelStepContent(funnel.steps[0].id, JSON.stringify({ saved: true }))
    setIsSaving(false)
  }

  return (
    <div className="flex flex-col h-screen -m-8">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-border bg-bg-primary flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/funnels">
            <Button variant="ghost" size="icon" className="w-8 h-8"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div className="h-4 w-px bg-border"></div>
          <div>
            <span className="font-semibold text-sm">{funnel.name} (Craft.js Builder)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-3 h-3 mr-2" /> {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      {/* Main Builder Area */}
      <div className="flex-1 flex bg-bg-secondary p-8 justify-center overflow-auto">
        <div className="w-full max-w-4xl bg-bg-primary shadow-xl rounded-lg overflow-hidden border border-border flex flex-col">
          <div className="bg-bg-secondary border-b border-border p-2 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          
          <div className="p-4 flex-1">
            <Editor resolver={{ TextComponent, ContainerComponent }}>
              <Frame>
                <Element is={ContainerComponent} canvas>
                  <TextComponent text="Welcome to the Advanced Craft.js Funnel Builder!" />
                </Element>
              </Frame>
            </Editor>
          </div>
        </div>
      </div>
    </div>
  )
}
