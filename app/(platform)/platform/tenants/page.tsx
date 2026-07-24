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
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Tenants</h1>
        <p className="text-text-secondary">
          Manage all registered agencies on the platform.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-bg-primary shadow-sm">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b border-border">
              <tr className="border-b border-border transition-colors hover:bg-bg-secondary/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-text-secondary">Agency Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-text-secondary">Plan Tier</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-text-secondary">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-text-secondary">Created</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-border transition-colors hover:bg-bg-secondary/50">
                  <td className="p-4 align-middle">
                    <div className="font-medium text-text-primary">{tenant.name}</div>
                    <div className="text-xs text-text-secondary">{tenant.subdomain}.nexlin.app</div>
                  </td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold uppercase text-text-primary">
                      {tenant.planTier}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                      tenant.status === 'active' ? 'bg-success/10 text-success border-success/20' :
                      tenant.status === 'trialing' ? 'bg-primary/10 text-primary border-primary/20' :
                      'bg-error/10 text-error border-error/20'
                    }`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-text-secondary">
                    {format(new Date(tenant.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="p-4 align-middle text-right">
                    <ImpersonateButton tenantId={tenant.id} tenantName={tenant.name} />
                  </td>
                </tr>
              ))}
              
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-text-secondary">
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
