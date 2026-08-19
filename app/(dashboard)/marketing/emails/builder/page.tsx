"use client"

import { useState } from "react"
import { saveEmailTemplate } from "@/app/actions/email-templates"
import { toast } from "sonner"
import { Mail, Plus, GripVertical, Trash2, Save, Eye, Type, ImageIcon, MousePointerClick, Minus, Loader2 } from "lucide-react"

type BlockType = "header" | "text" | "button" | "divider" | "image"

type Block = {
  id: string
  type: BlockType
  content: string
  styles?: {
    align?: "left" | "center" | "right"
    color?: string
    size?: "sm" | "md" | "lg"
  }
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: any }[] = [
  { type: "header", label: "Heading", icon: Type },
  { type: "text", label: "Text", icon: Type },
  { type: "button", label: "Button", icon: MousePointerClick },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "divider", label: "Divider", icon: Minus },
]

const DEFAULT_BLOCKS: Block[] = [
  { id: "1", type: "header", content: "Welcome to Nexlin 🚀", styles: { align: "center" } },
  { id: "2", type: "text", content: "Hi [First Name],\n\nThank you for joining! We're excited to have you on board.", styles: { align: "left" } },
  { id: "3", type: "button", content: "Get Started", styles: { align: "center", color: "#6366f1" } },
  { id: "4", type: "divider", content: "" },
  { id: "5", type: "text", content: "If you have any questions, reply to this email — we read every message.", styles: { align: "left" } },
]

function generateHtml(blocks: Block[], subject: string): string {
  const rows = blocks
    .map((b) => {
      const align = b.styles?.align ?? "left"
      if (b.type === "header") {
        return `<tr><td style="padding:20px 40px 8px;text-align:${align}"><h1 style="margin:0;font-size:28px;font-weight:700;color:#1e293b;font-family:sans-serif">${b.content}</h1></td></tr>`
      }
      if (b.type === "text") {
        const html = b.content.replace(/\n/g, "<br/>")
        return `<tr><td style="padding:8px 40px;text-align:${align};font-size:15px;line-height:1.6;color:#475569;font-family:sans-serif">${html}</td></tr>`
      }
      if (b.type === "button") {
        const bg = b.styles?.color ?? "#6366f1"
        return `<tr><td style="padding:20px 40px;text-align:${align}"><a href="#" style="display:inline-block;padding:14px 32px;background:${bg};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;font-family:sans-serif">${b.content}</a></td></tr>`
      }
      if (b.type === "divider") {
        return `<tr><td style="padding:16px 40px"><hr style="border:none;border-top:1px solid #e2e8f0"/></td></tr>`
      }
      if (b.type === "image") {
        return `<tr><td style="padding:16px 40px;text-align:${align}"><img src="${b.content || "https://via.placeholder.com/600x200?text=Image"}" alt="" style="max-width:100%;border-radius:8px"/></td></tr>`
      }
      return ""
    })
    .join("\n")

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
      <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center">
        <h2 style="color:#fff;margin:0;font-size:22px;font-weight:700">✦ Your Company</h2>
      </td></tr>
      ${rows}
      <tr><td style="padding:24px 40px;background:#f8fafc;text-align:center;font-size:12px;color:#94a3b8;font-family:sans-serif">
        © 2026 Your Company · <a href="#" style="color:#6366f1;text-decoration:none">Unsubscribe</a>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`
}

export default function EmailBuilderPage() {
  const [blocks, setBlocks] = useState<Block[]>(DEFAULT_BLOCKS)
  const [subject, setSubject] = useState("Welcome to Nexlin!")
  const [templateName, setTemplateName] = useState("")
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: Math.random().toString(36).slice(2),
      type,
      content: type === "header" ? "New Heading" : type === "text" ? "New paragraph..." : type === "button" ? "Click Here" : type === "image" ? "" : "",
      styles: { align: "left" },
    }
    setBlocks((prev) => [...prev, newBlock])
    setEditingId(newBlock.id)
  }

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)))
  }

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    if (editingId === id) setEditingId(null)
  }

  const moveBlock = (id: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      if (idx + dir < 0 || idx + dir >= prev.length) return prev
      const next = [...prev]
      const [removed] = next.splice(idx, 1)
      next.splice(idx + dir, 0, removed)
      return next
    })
  }

  const handleSave = async () => {
    if (!templateName.trim()) { toast.error("Give the template a name"); return }
    setSaving(true)
    const html = generateHtml(blocks, subject)
    const res = await saveEmailTemplate({ name: templateName, subject, content: html })
    setSaving(false)
    if (res.success) {
      toast.success("Template saved!")
    } else {
      toast.error(res.error)
    }
  }

  const previewHtml = generateHtml(blocks, subject)

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            Email Builder
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Visual block-based email template editor</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-text-secondary hover:text-primary hover:border-primary/50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {preview ? "Back to Editor" : "Preview"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Template"}
          </button>
        </div>
      </div>

      {/* Save Name + Subject Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5 block">Template Name</label>
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g. Welcome Sequence - Day 1"
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5 block">Email Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Welcome to {{company_name}}!"
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {preview ? (
        /* Preview Mode */
        <div className="bg-bg-secondary rounded-xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-3 uppercase tracking-wider font-medium">Email Preview</p>
          <iframe
            srcDoc={previewHtml}
            className="w-full rounded-lg border border-border bg-white"
            style={{ minHeight: "600px" }}
            title="email-preview"
            sandbox="allow-same-origin"
          />
        </div>
      ) : (
        /* Editor Mode */
        <div className="grid grid-cols-3 gap-5">
          {/* Block Palette */}
          <div className="col-span-1">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Add Blocks</p>
            <div className="space-y-2">
              {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border text-sm text-text-secondary hover:text-primary hover:border-primary/50 bg-bg-primary transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="col-span-2 bg-bg-secondary rounded-xl p-4 border border-border space-y-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Email Canvas — {blocks.length} block{blocks.length !== 1 ? "s" : ""}
            </p>
            {blocks.map((block, idx) => (
              <div
                key={block.id}
                onClick={() => setEditingId(editingId === block.id ? null : block.id)}
                className={`group bg-bg-primary border rounded-xl p-4 cursor-pointer transition-all ${
                  editingId === block.id ? "border-primary shadow-sm" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-xs font-medium text-primary capitalize">{block.type}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveBlock(block.id, -1) }}
                      disabled={idx === 0}
                      className="p-1 rounded text-text-secondary hover:text-primary disabled:opacity-30 transition-colors"
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 1) }}
                      disabled={idx === blocks.length - 1}
                      className="p-1 rounded text-text-secondary hover:text-primary disabled:opacity-30 transition-colors"
                    >
                      ↓
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteBlock(block.id) }}
                      className="p-1 rounded text-text-secondary hover:text-error transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Block Content Preview */}
                {block.type === "divider" ? (
                  <hr className="border-border" />
                ) : block.type === "button" ? (
                  <div className={block.styles?.align === "center" ? "text-center" : block.styles?.align === "right" ? "text-right" : "text-left"}>
                    <span
                      className="inline-block px-4 py-2 rounded-lg text-white text-sm font-medium"
                      style={{ background: block.styles?.color ?? "#6366f1" }}
                    >
                      {block.content}
                    </span>
                  </div>
                ) : block.type === "image" ? (
                  <div className={`${block.styles?.align === "center" ? "text-center" : block.styles?.align === "right" ? "text-right" : "text-left"} text-xs text-text-secondary`}>
                    {block.content ? (
                      <img src={block.content} alt="" className="max-w-full rounded-lg max-h-24 object-cover" />
                    ) : (
                      <div className="h-16 bg-bg-secondary rounded-lg flex items-center justify-center text-text-secondary gap-2">
                        <ImageIcon className="w-5 h-5" /> Enter image URL below
                      </div>
                    )}
                  </div>
                ) : block.type === "header" ? (
                  <h2 className={`text-xl font-bold text-text-primary ${block.styles?.align === "center" ? "text-center" : block.styles?.align === "right" ? "text-right" : "text-left"}`}>{block.content}</h2>
                ) : (
                  <p className={`text-sm text-text-secondary ${block.styles?.align === "center" ? "text-center" : block.styles?.align === "right" ? "text-right" : "text-left"} whitespace-pre-wrap`}>{block.content}</p>
                )}

                {/* Inline Editor */}
                {editingId === block.id && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2" onClick={(e) => e.stopPropagation()}>
                    {block.type !== "divider" && (
                      <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={block.type === "image" ? "https://..." : "Content..."}
                        className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        rows={block.type === "text" ? 3 : 1}
                        autoFocus
                      />
                    )}
                    <div className="flex items-center gap-3">
                      {block.type !== "divider" && (
                        <div className="flex gap-1">
                          {(["left", "center", "right"] as const).map((a) => (
                            <button
                              key={a}
                              onClick={() => updateBlock(block.id, { styles: { ...(block.styles ?? {}), align: a } })}
                              className={`px-2 py-1 rounded text-xs transition-colors ${block.styles?.align === a ? "bg-primary text-white" : "border border-border text-text-secondary hover:border-primary/50"}`}
                            >
                              {a[0].toUpperCase()}
                            </button>
                          ))}
                        </div>
                      )}
                      {block.type === "button" && (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-text-secondary">Color:</label>
                          <input
                            type="color"
                            value={block.styles?.color ?? "#6366f1"}
                            onChange={(e) => updateBlock(block.id, { styles: { ...(block.styles ?? {}), color: e.target.value } })}
                            className="w-8 h-8 rounded border border-border cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {blocks.length === 0 && (
              <div className="text-center py-12 text-text-secondary">
                <Mail className="w-8 h-8 opacity-20 mx-auto mb-3" />
                <p className="text-sm">Click a block type on the left to start building</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
