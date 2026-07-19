"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, GripVertical, Trash2, Plus, ArrowLeft, Sparkles, Smartphone, Monitor, Wand2 } from "lucide-react"
import { updateFormFields, generateFormFields, optimizeFieldLabel } from "@/app/actions/forms"
import { toast } from "sonner"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

export default function FormBuilder({ form, onBack }: { form: any, onBack: () => void }) {
  const [fields, setFields] = useState<any[]>(() => {
    try {
      return JSON.parse(form.fields || "[]")
    } catch {
      return []
    }
  })
  const [isSaving, setIsSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [optimizingIndex, setOptimizingIndex] = useState<number | null>(null)

  const handleGenerateForm = async () => {
    if (!aiPrompt.trim()) return
    setIsGenerating(true)
    const res = await generateFormFields(aiPrompt)
    if (res.success && res.data) {
      setFields(res.data.map((f: any) => ({ ...f, id: Math.random().toString(36).substr(2, 9) })))
      toast.success("AI generated your form!")
      setAiPrompt("")
    } else {
      toast.error(res.error || "Failed to generate form")
    }
    setIsGenerating(false)
  }

  const handleOptimizeLabel = async (index: number) => {
    setOptimizingIndex(index)
    const res = await optimizeFieldLabel(fields[index].label)
    if (res.success && res.data) {
      updateField(index, { label: res.data })
      toast.success("Label optimized for conversion!")
    } else {
      toast.error("Optimization failed")
    }
    setOptimizingIndex(null)
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return
    const newFields = Array.from(fields)
    const [reorderedItem] = newFields.splice(result.source.index, 1)
    newFields.splice(result.destination.index, 0, reorderedItem)
    setFields(newFields)
  }

  const addField = (type: string) => {
    setFields([...fields, { 
      id: Math.random().toString(36).substr(2, 9),
      type, 
      label: `New ${type} field`, 
      required: false 
    }])
  }

  const updateField = (index: number, updates: any) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...updates }
    setFields(newFields)
  }

  const deleteField = (index: number) => {
    const newFields = [...fields]
    newFields.splice(index, 1)
    setFields(newFields)
  }

  const handleSave = async () => {
    setIsSaving(true)
    const res = await updateFormFields(form.id, fields)
    setIsSaving(false)
    if (res.success) toast.success("Form saved!")
    else toast.error("Failed to save form")
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Left Sidebar - Canvas */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
            <CardTitle>{form.name} — Builder</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-bg-secondary p-1 rounded-lg flex border border-border">
              <Button variant={previewMode === "desktop" ? "secondary" : "ghost"} size="sm" className="h-7 px-3" onClick={() => setPreviewMode("desktop")}>
                <Monitor className="w-4 h-4 mr-2" /> Desktop
              </Button>
              <Button variant={previewMode === "mobile" ? "secondary" : "ghost"} size="sm" className="h-7 px-3" onClick={() => setPreviewMode("mobile")}>
                <Smartphone className="w-4 h-4 mr-2" /> Mobile
              </Button>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Form"}
            </Button>
          </div>
        </CardHeader>
        
        <div className="p-4 border-b bg-bg-secondary/30 flex gap-2 items-center">
          <Sparkles className="w-5 h-5 text-primary ml-2" />
          <Input 
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. I need a lead capture form for my roofing business offering free inspections..."
            className="flex-1 border-primary/20 focus-visible:ring-primary/50"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateForm()}
          />
          <Button disabled={isGenerating || !aiPrompt.trim()} onClick={handleGenerateForm} className="bg-primary/10 text-primary hover:bg-primary/20">
            {isGenerating ? "Generating..." : "✨ Auto-Generate Form"}
          </Button>
        </div>

        <CardContent className="flex-1 overflow-y-auto p-8 bg-bg-secondary/50 flex justify-center">
          <div className={`transition-all duration-300 ${previewMode === "mobile" ? "w-[375px] border-8 rounded-[2.5rem]" : "w-full max-w-2xl border rounded-xl"} bg-background shadow-xl flex flex-col overflow-hidden border-border min-h-[500px]`}>
            {/* Header of the mock form */}
            <div className="p-8 pb-4 text-center border-b border-border/50 bg-bg-secondary/30">
              <h2 className="text-2xl font-bold tracking-tight text-text-primary">Let's get started</h2>
              <p className="text-sm text-text-secondary mt-2">Fill out the details below.</p>
            </div>

            <div className="flex-1 p-6 sm:p-8">
            {fields.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-secondary border-2 border-dashed rounded-lg p-8 text-center bg-bg-secondary/20">
                <p>Drag fields here or use the <span className="font-semibold text-primary">AI Auto-Generator</span> above.</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="form-fields">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                      {fields.map((field, index) => (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              className="group relative border border-transparent hover:border-border rounded-xl p-4 -mx-4 transition-all hover:bg-bg-secondary/20 flex gap-4"
                            >
                              <div {...provided.dragHandleProps} className="mt-8 cursor-grab opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <label className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2 w-full">
                                      <Input 
                                        value={field.label} 
                                        onChange={(e) => updateField(index, { label: e.target.value })}
                                        className="font-semibold text-base bg-transparent border-transparent hover:border-border px-2 py-1 h-8 -ml-2 focus-visible:ring-primary shadow-none"
                                      />
                                      {field.required && <span className="text-error text-lg">*</span>}
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-primary hover:text-primary hover:bg-primary/10 h-8 text-xs px-2" 
                                      onClick={() => handleOptimizeLabel(index)}
                                      disabled={optimizingIndex === index}
                                    >
                                      {optimizingIndex === index ? <Wand2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                      Optimize
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-error hover:text-error hover:bg-error/10" onClick={() => deleteField(index)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {field.type === "textarea" ? (
                                  <textarea disabled placeholder="Type your answer here..." className="w-full p-3 rounded-lg border border-border bg-background opacity-60 min-h-[100px] resize-none" />
                                ) : (
                                  <Input disabled placeholder="Type your answer here..." className="opacity-60 h-12 text-base rounded-lg" />
                                )}

                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                                    <input 
                                      type="checkbox" 
                                      className="rounded border-border text-primary focus:ring-primary"
                                      checked={field.required} 
                                      onChange={(e) => updateField(index, { required: e.target.checked })}
                                    />
                                    Mark as Required
                                  </label>
                                  <span className="text-xs px-2 py-1 bg-bg-secondary rounded-md text-text-secondary border border-border">{field.type}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
            
            {fields.length > 0 && (
              <div className="pt-8">
                <Button className="w-full h-12 text-base rounded-lg" disabled>Submit Form</Button>
              </div>
            )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Sidebar - Palette */}
      <Card className="w-72 flex flex-col">
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-sm font-semibold">Form Elements</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <Button variant="outline" className="w-full justify-start text-left font-normal" onClick={() => addField("text")}>
            <Plus className="w-4 h-4 mr-2" /> Single Line Text
          </Button>
          <Button variant="outline" className="w-full justify-start text-left font-normal" onClick={() => addField("email")}>
            <Plus className="w-4 h-4 mr-2" /> Email Address
          </Button>
          <Button variant="outline" className="w-full justify-start text-left font-normal" onClick={() => addField("tel")}>
            <Plus className="w-4 h-4 mr-2" /> Phone Number
          </Button>
          <Button variant="outline" className="w-full justify-start text-left font-normal" onClick={() => addField("textarea")}>
            <Plus className="w-4 h-4 mr-2" /> Multi-Line Text
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
