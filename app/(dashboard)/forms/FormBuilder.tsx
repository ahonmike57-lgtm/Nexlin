"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, GripVertical, Trash2, Plus, ArrowLeft } from "lucide-react"
import { updateFormFields } from "@/app/actions/reporting" // using existing action location or form action
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
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Form"}
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-8 bg-bg-secondary/50">
          <div className="max-w-lg mx-auto bg-background border rounded-xl shadow-sm p-6 min-h-[400px]">
            {fields.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-secondary border-2 border-dashed rounded-lg p-8 text-center">
                Drag fields here from the right panel to start building your form.
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="form-fields">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {fields.map((field, index) => (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              className="group relative border rounded-lg p-4 bg-background hover:border-primary transition-colors flex gap-4"
                            >
                              <div {...provided.dragHandleProps} className="mt-1 cursor-grab opacity-50 group-hover:opacity-100">
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                  <Input 
                                    value={field.label} 
                                    onChange={(e) => updateField(index, { label: e.target.value })}
                                    className="font-medium bg-transparent border-transparent hover:border-border px-1 py-1 h-8 -ml-1 focus-visible:ring-0"
                                  />
                                  <span className="text-xs px-2 py-0.5 bg-bg-secondary rounded-full text-text-secondary">{field.type}</span>
                                </div>
                                <Input disabled placeholder={`${field.label}...`} className="opacity-50" />
                                <div className="flex items-center justify-between mt-2">
                                  <label className="flex items-center gap-2 text-xs text-text-secondary">
                                    <input 
                                      type="checkbox" 
                                      checked={field.required} 
                                      onChange={(e) => updateField(index, { required: e.target.checked })}
                                    />
                                    Required
                                  </label>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-error hover:text-error hover:bg-error/10" onClick={() => deleteField(index)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
              <Button className="w-full mt-6" disabled>Submit Button (Fixed)</Button>
            )}
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
