"use client"

import React, { useRef, useState, useEffect } from "react"
import { Eraser, Check, Type, PenTool } from "lucide-react"

interface SignaturePadProps {
  onSave: (signatureDataUrl: string, signerName: string) => void
  onCancel: () => void
}

export default function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [mode, setMode] = useState<"draw" | "type">("draw")
  const [typedName, setTypedName] = useState("")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    ctx.strokeStyle = "#1e293b"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [mode])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
    setHasDrawn(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleComplete = () => {
    if (mode === "draw") {
      const canvas = canvasRef.current
      if (!canvas || !hasDrawn) return
      const dataUrl = canvas.toDataURL("image/png")
      onSave(dataUrl, typedName || "Authorized Signer")
    } else {
      if (!typedName.trim()) return
      // Render typed signature to offscreen canvas
      const canvas = document.createElement("canvas")
      canvas.width = 400
      canvas.height = 120
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.font = "italic 32px 'Brush Script MT', cursive, sans-serif"
        ctx.fillStyle = "#1e293b"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(typedName, canvas.width / 2, canvas.height / 2)
        onSave(canvas.toDataURL("image/png"), typedName)
      }
    }
  }

  return (
    <div className="bg-bg-primary border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Electronic Signature</h3>
          <p className="text-xs text-text-secondary">Sign this proposal legally with tamper-evident certificate</p>
        </div>
        <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg">
          <button
            onClick={() => setMode("draw")}
            className={`p-1.5 rounded text-xs flex items-center gap-1 ${
              mode === "draw" ? "bg-bg-primary shadow text-text-primary" : "text-text-secondary"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" /> Draw
          </button>
          <button
            onClick={() => setMode("type")}
            className={`p-1.5 rounded text-xs flex items-center gap-1 ${
              mode === "type" ? "bg-bg-primary shadow text-text-primary" : "text-text-secondary"
            }`}
          >
            <Type className="w-3.5 h-3.5" /> Type
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-text-secondary block mb-1.5">Signer Full Name</label>
        <input
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          placeholder="e.g. Sarah Jenkins"
          className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {mode === "draw" ? (
        <div className="space-y-2">
          <div className="relative border-2 border-dashed border-border rounded-xl bg-slate-50 overflow-hidden h-40">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full cursor-crosshair touch-none"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-slate-400">
                Sign here with mouse or fingertip
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleClear}
              className="text-xs text-text-secondary hover:text-error flex items-center gap-1 transition-colors"
            >
              <Eraser className="w-3 h-3" /> Clear Signature
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-xl bg-slate-50 p-6 flex items-center justify-center h-40">
          <p className="font-serif italic text-2xl text-slate-800">
            {typedName || "Your Signature Preview"}
          </p>
        </div>
      )}

      <div className="bg-bg-secondary p-3 rounded-lg text-[11px] text-text-secondary">
        🔒 By clicking <strong>Accept & Sign</strong>, you consent to legally binding electronic signature execution under the ESIGN and UETA acts.
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleComplete}
          disabled={mode === "draw" ? !hasDrawn : !typedName.trim()}
          className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 shadow-sm"
        >
          Accept & Sign
        </button>
      </div>
    </div>
  )
}
