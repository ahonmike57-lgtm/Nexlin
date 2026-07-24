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
      <div className="h-full relative flex dark:bg-slate-900">
        <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
          <PlatformSidebar />
        </div>
        <main className="md:pl-72 w-full flex-1 overflow-y-auto">
          <div className="p-8">
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
