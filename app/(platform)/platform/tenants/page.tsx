import { db } from "@/lib/db"
import { ImpersonateButton } from "@/components/platform/ImpersonateButton"
import { format } from "date-fns"

export default async function PlatformTenantsPage() {
  const tenants = await db.agency.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: {
        where: { role: "admin" } // Show the primary admin/owner if possible
      }
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
        <p className="text-muted-foreground">
          Manage all registered agencies on the platform.
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Agency Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Plan Tier</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle">
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-xs text-muted-foreground">{tenant.subdomain}.nexlin.app</div>
                  </td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase">
                      {tenant.planTier}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                      tenant.status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      tenant.status === 'trialing' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-muted-foreground">
                    {format(new Date(tenant.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="p-4 align-middle text-right">
                    <ImpersonateButton tenantId={tenant.id} tenantName={tenant.name} />
                  </td>
                </tr>
              ))}
              
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    No tenants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
