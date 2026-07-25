import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { format } from "date-fns"
import { InviteAdminDialog } from "@/components/platform/InviteAdminDialog"
import { DeleteAdminButton } from "@/components/platform/DeleteAdminButton"
import { EditAdminRoleDialog } from "@/components/platform/EditAdminRoleDialog"

export default async function PlatformAdminsPage() {
  const session = await getSession()
  const currentUserId = (session?.user as any)?.id
  const isOwner = (session?.user as any)?.role === "owner"

  const admins = await db.platformAdmin.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Platform Administrators</h1>
          <p className="text-text-secondary">
            Manage users with God-mode access to the entire platform.
          </p>
        </div>
        <InviteAdminDialog isOwner={isOwner} />
      </div>

      <div className="rounded-xl border border-border bg-bg-primary shadow-sm">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b border-border">
              <tr className="border-b border-border transition-colors hover:bg-bg-secondary/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-text-secondary">Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-text-secondary">Email</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-text-secondary">Role</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-text-secondary">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-text-secondary">Last Login</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-text-secondary">Created</th>
                {isOwner && <th className="h-12 px-4 text-right align-middle font-medium text-text-secondary">Actions</th>}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {admins.map((admin) => {
                const isActive = !admin.status || admin.status === "active"

                return (
                  <tr key={admin.id} className="border-b border-border transition-colors hover:bg-bg-secondary/50">
                    <td className="p-4 align-middle font-medium text-text-primary">
                      {admin.name || "Pending Invite"}
                    </td>
                    <td className="p-4 align-middle text-text-primary">
                      {admin.email}
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        admin.role === 'owner' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        admin.role === 'developer' ? 'bg-primary/10 text-primary border-primary/20' :
                        'bg-bg-secondary text-text-primary border-border'
                      }`}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        isActive 
                          ? 'bg-success/10 text-success border-success/20' 
                          : 'bg-warning/10 text-warning border-warning/20'
                      }`}>
                        {isActive ? 'Active' : 'Pending Invite'}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-text-secondary">
                      {admin.lastLoginAt ? format(new Date(admin.lastLoginAt), "MMM d, yyyy h:mm a") : "Never"}
                    </td>
                    <td className="p-4 align-middle text-text-secondary">
                      {format(new Date(admin.createdAt), "MMM d, yyyy")}
                    </td>
                    {isOwner && (
                      <td className="p-4 align-middle text-right flex items-center justify-end gap-1">
                        <EditAdminRoleDialog
                          adminId={admin.id}
                          adminName={admin.name || ""}
                          adminEmail={admin.email}
                          currentRole={admin.role}
                          currentStatus={admin.status || "active"}
                          isSelf={admin.id === currentUserId}
                        />
                        <DeleteAdminButton 
                          adminId={admin.id} 
                          adminEmail={admin.email} 
                          currentAdminId={currentUserId}
                        />
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
