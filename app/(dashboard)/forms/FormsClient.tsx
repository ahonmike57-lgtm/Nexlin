"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, LayoutTemplate, MoreVertical, Copy, Edit2, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { createForm } from "@/app/actions/forms"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function FormsClient({ initialForms, agencyId }: { initialForms: any[], agencyId: string }) {
  const [forms, setForms] = useState(initialForms)
  const [isOpen, setIsOpen] = useState(false)
  const [newFormName, setNewFormName] = useState("")
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  const handleCreate = async () => {
    if (!newFormName.trim()) {
      toast.error("Form name is required")
      return
    }

    setCreating(true)
    const res = await createForm(agencyId, newFormName)
    setCreating(false)

    if (res.success) {
      toast.success("Form created successfully")
      setForms([res.form, ...forms])
      setIsOpen(false)
      setNewFormName("")
    } else {
      toast.error(res.error || "Failed to create form")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Forms & Surveys</h1>
          <p className="text-text-secondary text-sm">Create custom forms to capture leads and feedback.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Form
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Form Name</label>
                <Input 
                  value={newFormName}
                  onChange={(e) => setNewFormName(e.target.value)}
                  placeholder="e.g. Website Contact Form"
                />
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? "Creating..." : "Create Form"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-bg-secondary/50 rounded-lg border border-dashed border-border text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <LayoutTemplate className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-1">No forms yet</h3>
          <p className="text-text-secondary text-sm mb-4">Create your first form to start collecting responses.</p>
          <Button onClick={() => setIsOpen(true)}>Create Form</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <Card key={form.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <LayoutTemplate className="w-5 h-5" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mr-2">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Edit2 className="w-4 h-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Copy className="w-4 h-4" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-error">
                        <Trash2 className="w-4 h-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <h3 className="font-semibold text-lg mb-1">{form.name}</h3>
                
                <div className="flex items-center gap-4 text-sm text-text-secondary mt-4">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-text-primary">{form._count?.submissions || 0}</span>
                    <span>Submissions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${form.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    {form.isActive ? 'Active' : 'Draft'}
                  </div>
                </div>
                
                <div className="mt-6 flex gap-2">
                  <Button variant="outline" className="w-full text-sm h-8">View Results</Button>
                  <Button className="w-full text-sm h-8">Edit Builder</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
