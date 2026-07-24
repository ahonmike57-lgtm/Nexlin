import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PlatformSidebar } from "@/components/platform/PlatformSidebar"

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
}
