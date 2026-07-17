"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Building2, Trash2 } from "lucide-react"
import Link from "next/link"
import { createSubAccount, deleteSubAccount } from "@/app/actions/subaccounts"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function SubAccountsPage({ initialSubAccounts, agencyId }: any) {
  const [subAccounts, setSubAccounts] = useState(initialSubAccounts || [])
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const router = useRouter()

  const handleCreate = async () => {
    if (!newName.trim()) return toast.error("Name required")
    setIsCreating(true)
    const res = await createSubAccount(agencyId, newName)
    setIsCreating(false)
    if (res.success) {
      toast.success("Sub-account created")
      setSubAccounts([...subAccounts, res.data])
      setNewName("")
    } else {
      toast.error(res.error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sub-account? This cannot be undone.")) return
    const res = await deleteSubAccount(id)
    if (res.success) {
      toast.success("Sub-account deleted")
      setSubAccounts(subAccounts.filter((s: any) => s.id !== id))
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sub-Accounts</h1>
          <p className="text-text-secondary">Manage your clients' individual workspaces.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Sub-Account</CardTitle>
          <CardDescription>Add a new isolated workspace for a client.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input 
            placeholder="Client / Business Name" 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)} 
            className="max-w-xs" 
          />
          <Button onClick={handleCreate} disabled={isCreating}>
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? "Creating..." : "Create Workspace"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {subAccounts.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed rounded-lg text-text-secondary">
            No sub-accounts yet.
          </div>
        ) : (
          subAccounts.map((sub: any) => (
            <Card key={sub.id} className="flex flex-row items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{sub.name}</h3>
                  <p className="text-sm text-text-secondary">Created {new Date(sub.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <Button variant="danger" size="icon" onClick={() => handleDelete(sub.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
