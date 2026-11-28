"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Mail, Copy, Send, Trash2, Check, X } from "lucide-react"
import {
  inviteTeamMember,
  resendTeamInvite,
  updateTeamMemberRole,
  removeTeamMember,
} from "@/app/actions/settings"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface TeamMember {
  id: string
  name: string | null
  email: string | null
  role: string
  createdAt: string | Date
  status?: "active" | "pending"
}

const EDITABLE_ROLES = [
  "Team Member",
  "Agency Admin",
  "Sales Rep",
  "Support Agent",
  "Read Only",
]

export default function TeamClient({
  initialTeam,
  currentUserId,
}: {
  initialTeam: TeamMember[]
  currentUserId?: string
}) {
  const [members, setMembers] = useState<TeamMember[]>(initialTeam)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("Team Member")
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null)
  const [inviteBanner, setInviteBanner] = useState<{
    email: string
    inviteUrl: string
    emailSent: boolean
  } | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMembers(initialTeam)
  }, [initialTeam])

  const handleCopyInviteUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(true)
      toast.success("Invite link copied to clipboard")
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      toast.error("Could not copy automatically — please copy the link manually.")
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    const res = await inviteTeamMember(inviteEmail, inviteRole)
    setIsInviting(false)

    if (res.success && res.data) {
      setMembers((prev) => [...prev, res.data as TeamMember])
      const invitedEmail = res.data.email || inviteEmail.trim().toLowerCase()
      setInviteEmail("")
      if ("inviteUrl" in res && res.inviteUrl) {
        setInviteBanner({
          email: invitedEmail,
          inviteUrl: res.inviteUrl,
          emailSent: Boolean("emailSent" in res && res.emailSent),
        })
      }
      if ("emailSent" in res && res.emailSent) {
        toast.success(`Invitation email sent to ${invitedEmail}`)
      } else {
        toast.success(`Member added — share the 7-day setup link for ${invitedEmail}`)
      }
      router.refresh()
    } else {
      toast.error(("error" in res && res.error) || "Failed to invite team member")
    }
  }

  const handleResendInvite = async (member: TeamMember) => {
    setBusyMemberId(member.id)
    const res = await resendTeamInvite(member.id)
    setBusyMemberId(null)

    if (res.success && "inviteUrl" in res && res.inviteUrl) {
      const label = member.email || member.name || "member"
      setInviteBanner({
        email: label,
        inviteUrl: res.inviteUrl,
        emailSent: Boolean(res.emailSent),
      })
      if (res.emailSent) {
        toast.success(`Invite email resent to ${label}`)
      } else {
        toast.success(`Fresh 7-day setup link generated for ${label}`)
      }
    } else {
      toast.error(("error" in res && res.error) || "Failed to generate invite link")
    }
  }

  const handleRoleChange = async (member: TeamMember, nextRole: string) => {
    if (nextRole === member.role) return
    const previousRole = member.role
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, role: nextRole } : m))
    )
    setBusyMemberId(member.id)
    const res = await updateTeamMemberRole(member.id, nextRole)
    setBusyMemberId(null)

    if (res.success) {
      toast.success(`Updated ${member.name || member.email} to ${nextRole}`)
      router.refresh()
    } else {
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: previousRole } : m))
      )
      toast.error(("error" in res && res.error) || "Failed to update role")
    }
  }

  const handleRemoveMember = async (member: TeamMember) => {
    if (!window.confirm(`Remove ${member.name || member.email} from this agency workspace?`)) {
      return
    }
    setBusyMemberId(member.id)
    const res = await removeTeamMember(member.id)
    setBusyMemberId(null)

    if (res.success) {
      setMembers((prev) => prev.filter((m) => m.id !== member.id))
      toast.success(`${member.name || member.email} removed from team`)
      router.refresh()
    } else {
      toast.error(("error" in res && res.error) || "Failed to remove team member")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Team Management</h2>
        <p className="text-text-secondary">Manage who has access to this agency workspace.</p>
      </div>

      {inviteBanner && (
        <Card className="p-4 border-primary/40 bg-primary/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">
                {inviteBanner.emailSent
                  ? `Invite email sent to ${inviteBanner.email} — you can also copy the setup link below:`
                  : `Email service not configured — copy and share this 7-day setup link with ${inviteBanner.email}:`}
              </p>
              <code className="block text-xs bg-bg-primary border border-border rounded px-2.5 py-1.5 text-text-secondary truncate">
                {inviteBanner.inviteUrl}
              </code>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleCopyInviteUrl(inviteBanner.inviteUrl)}
                className="gap-1.5"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedUrl ? "Copied" : "Copy Link"}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setInviteBanner(null)}
                aria-label="Dismiss invite link"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-secondary uppercase bg-bg-secondary border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const isOwner = member.role === "Agency Owner"
                    const isSelf = Boolean(currentUserId && member.id === currentUserId)
                    const isBusy = busyMemberId === member.id
                    const canManage = !isOwner && !isSelf

                    return (
                      <tr key={member.id} className="border-b border-border hover:bg-bg-secondary/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {member.name?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="font-semibold text-text-primary">
                                {member.name || member.email?.split("@")[0] || "Member"}
                                {isSelf && <span className="ml-1.5 text-xs font-normal text-text-secondary">(You)</span>}
                              </p>
                              <p className="text-xs text-text-secondary">{member.email || "No email"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {canManage ? (
                            <select
                              aria-label={`Role for ${member.email}`}
                              value={EDITABLE_ROLES.includes(member.role) ? member.role : "Team Member"}
                              disabled={isBusy}
                              onChange={(e) => handleRoleChange(member, e.target.value)}
                              className="px-2.5 py-1 bg-bg-primary border border-border rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                              {EDITABLE_ROLES.map((roleOption) => (
                                <option key={roleOption} value={roleOption}>
                                  {roleOption}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Badge variant={isOwner ? "default" : "secondary"}>
                              {member.role}
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={member.status === "pending" ? "outline" : "secondary"}>
                            {member.status === "pending" ? "Pending Invite" : "Active"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-text-secondary">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {canManage ? (
                            <div className="inline-flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => handleResendInvite(member)}
                                title="Send / Copy Invite Link"
                                className="h-8 px-2 text-xs gap-1"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Invite Link</span>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={isBusy}
                                onClick={() => handleRemoveMember(member)}
                                title="Remove Member"
                                className="w-8 h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-text-secondary">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">
                        No team members found.
                      </td>
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
                  <option value="Sales Rep">Sales Rep</option>
                  <option value="Support Agent">Support Agent</option>
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
