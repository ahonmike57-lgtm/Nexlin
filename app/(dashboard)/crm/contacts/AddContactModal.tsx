"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { createContact } from "@/app/actions/contacts"

export default function AddContactModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
    }
    
    // We are hardcoding the agency ID for now until the global auth context is fully wired up
    const response = await createContact("agency-1", data)
    
    setLoading(false)
    if (response.success) {
      setOpen(false)
    } else {
      alert("Failed to create contact")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" /> Add Contact</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create new contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">First name</label>
              <Input name="firstName" required placeholder="John" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last name</label>
              <Input name="lastName" placeholder="Doe" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Email address</label>
            <Input name="email" type="email" placeholder="john@example.com" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone number</label>
            <Input name="phone" type="tel" placeholder="+1 (555) 000-0000" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Company name</label>
            <Input name="company" placeholder="Acme Inc." />
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
