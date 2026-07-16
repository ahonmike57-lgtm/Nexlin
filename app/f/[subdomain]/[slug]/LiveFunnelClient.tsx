"use client"

import { Editor, Frame, useNode } from "@craftjs/core"
import { Button } from "@/components/ui/button"

// Reusable CraftJS Components (Matches Builder)
const ContainerComponent = ({ children, padding = 20, background = "#ffffff" }: any) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div 
      ref={(ref: any) => connect(drag(ref))} 
      style={{ padding: `${padding}px`, backgroundColor: background }}
      className="w-full"
    >
      {children}
    </div>
  )
}
ContainerComponent.craft = {
  props: { padding: 20, background: "#ffffff" },
  rules: { canDrag: () => true },
}

const TextComponent = ({ text, fontSize = 16, textAlign = "left", color = "#000000" }: any) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div 
      ref={(ref: any) => connect(drag(ref))} 
      style={{ fontSize: `${fontSize}px`, textAlign, color }}
      className="p-2"
    >
      {text}
    </div>
  )
}
TextComponent.craft = {
  props: { text: "Text block", fontSize: 16, textAlign: "left", color: "#000000" },
  rules: { canDrag: () => true },
}

const ButtonComponent = ({ text = "Click Me", variant = "default" }: any) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div ref={(ref: any) => connect(drag(ref))} className="inline-block p-2">
      <Button variant={variant}>{text}</Button>
    </div>
  )
}
ButtonComponent.craft = {
  props: { text: "Click Me", variant: "default" },
  rules: { canDrag: () => true },
}

const ImageComponent = ({ src = "https://via.placeholder.com/400x200" }: any) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div ref={(ref: any) => connect(drag(ref))} className="p-2">
      <img src={src} alt="Live Page Image" className="w-full h-auto rounded-lg" />
    </div>
  )
}
ImageComponent.craft = {
  props: { src: "https://via.placeholder.com/400x200" },
  rules: { canDrag: () => true },
}

export default function LiveFunnelClient({ funnel, step, subdomain }: { funnel: any; step: any; subdomain: string }) {
  
  // If no content was saved yet, render a fallback.
  const hasContent = step.content && step.content !== "{}"

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Editor 
        resolver={{ ContainerComponent, TextComponent, ButtonComponent, ImageComponent }}
        enabled={false} // Disable editing on live page
      >
        {hasContent ? (
          <Frame data={step.content} />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
            <h1 className="text-4xl font-bold mb-4">{step.name}</h1>
            <p className="text-gray-500 max-w-lg mx-auto">
              This funnel step has not been published yet. Please open the Funnel Builder and save your design.
            </p>
          </div>
        )}
      </Editor>
    </div>
  )
}
