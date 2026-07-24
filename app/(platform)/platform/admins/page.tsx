import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { format } from "date-fns"

export default async function PlatformAdminsPage() {
  const session = await getSession()
  const isOwner = (session?.user as any)?.role === "owner"

  const admins = await db.platformAdmin.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Administrators</h1>
          <p className="text-muted-foreground">
            Manage users with God-mode access to the entire platform.
          </p>
        </div>
        {isOwner && (
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
            Invite Admin
          </button>
        )}
      </div>

      <div className="rounded-md border bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Last Login</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle font-medium">
                    {admin.name || "Pending Invite"}
                  </td>
                  <td className="p-4 align-middle">
                    {admin.email}
                  </td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                      admin.role === 'owner' ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400' :
                      admin.role === 'developer' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {admin.role}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-muted-foreground">
                    {admin.lastLoginAt ? format(new Date(admin.lastLoginAt), "MMM d, yyyy h:mm a") : "Never"}
                  </td>
                  <td className="p-4 align-middle text-muted-foreground">
                    {format(new Date(admin.createdAt), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
