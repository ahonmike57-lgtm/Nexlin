"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, UserPlus, MoreVertical, Mail } from "lucide-react"
import { inviteTeamMember } from "@/app/actions/settings"
import { useRouter } from "next/navigation"

export default function TeamClient({ initialTeam, agencyId }: { initialTeam: any[], agencyId: string }) {
  const [isInviting, setIsInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("Team Member")
  const router = useRouter()

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return

    setIsInviting(true)
    const res = await inviteTeamMember(agencyId, inviteEmail, inviteRole)
    if (res.success) {
      setInviteEmail("")
      router.refresh()
    }
    setIsInviting(false)
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-text-secondary mt-1">Manage who has access to this agency workspace.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-secondary uppercase bg-bg-secondary border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {initialTeam.map((member) => (
                    <tr key={member.id} className="border-b border-border hover:bg-bg-secondary/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {member.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">{member.name}</p>
                            <p className="text-xs text-text-secondary">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={member.role === 'Agency Owner' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="w-8 h-8"><MoreVertical className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))}
                  {initialTeam.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">No team members found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5" /> Invite Member
            </h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input 
                    type="email" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com" 
                    className="w-full pl-9 pr-4 py-2 bg-bg-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2 bg-bg-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="Team Member">Team Member (Standard)</option>
                  <option value="Agency Admin">Agency Admin</option>
                  <option value="Read Only">Read Only</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={isInviting}>
                {isInviting ? "Sending..." : "Send Invite"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
