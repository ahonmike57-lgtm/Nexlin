import { db } from "@/lib/db"
import Image from "next/image"

export default async function PlatformAppsPage() {
  const apps = await db.app.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { installs: true }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketplace Analytics</h1>
        <p className="text-muted-foreground">
          Global overview of app installations across all tenants.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {apps.map((app) => (
          <div key={app.id} className="flex flex-col rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
            <div className="p-6 flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center p-2">
                  {app.icon ? (
                    <img src={app.icon} alt={app.name} className="h-full w-full object-contain" />
                  ) : (
                    <div className="h-full w-full bg-slate-200 rounded" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold leading-none tracking-tight">{app.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{app.category}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {app.description}
              </p>
            </div>
            
            <div className="bg-muted/50 p-4 border-t flex items-center justify-between">
              <span className="text-sm font-medium">Total Installs</span>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {app._count.installs}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
