import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PlatformSidebar } from "@/components/platform/PlatformSidebar"

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const session = await getSession()

    // Strict role protection: Must be a logged-in platform admin
    if (!session || !session.user || !(session.user as any).isPlatformAdmin) {
      redirect("/login")
    }

    return (
      <div className="flex h-screen bg-bg-secondary overflow-hidden text-text-primary">
        <aside className="w-64 bg-bg-primary border-r border-border flex flex-col z-10 hidden md:flex">
          <PlatformSidebar />
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-bg-primary border-b border-border flex items-center justify-between px-6 z-[50] relative">
            <div className="flex-1 max-w-md">
              <h2 className="text-lg font-bold text-text-primary">Platform Administration</h2>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  } catch (e: any) {
    if (e.message && e.message === "NEXT_REDIRECT") throw e; // Let Next.js handle redirects

    return (
      <div className="p-8 bg-error/10 text-error border border-error/20 rounded-xl h-screen flex flex-col items-center justify-center">
        <h2 className="font-bold text-lg mb-2">Error in Platform Layout</h2>
        <pre className="whitespace-pre-wrap">{e.message}</pre>
        <pre className="whitespace-pre-wrap text-sm mt-4">{e.stack}</pre>
      </div>
    )
  }
}
