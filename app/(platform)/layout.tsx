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
      <div className="flex h-screen overflow-hidden bg-[#050505] text-zinc-100 selection:bg-primary/30">
        {/* Subtle background glow/mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-500/5 blur-[120px]" />
        </div>

        <div className="w-64 hidden md:block z-10 border-r border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
          <PlatformSidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-10 z-10 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    )
  } catch (e: any) {
    if (e.message && e.message === "NEXT_REDIRECT") throw e; // Let Next.js handle redirects

    return (
      <div className="p-8 bg-red-50 text-red-500 border border-red-200 rounded-xl h-screen flex flex-col items-center justify-center">
        <h2 className="font-bold text-lg mb-2">Error in Platform Layout</h2>
        <pre className="whitespace-pre-wrap">{e.message}</pre>
        <pre className="whitespace-pre-wrap text-sm mt-4">{e.stack}</pre>
      </div>
    )
  }
}
