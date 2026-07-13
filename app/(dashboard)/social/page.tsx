import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getSocialAccounts, getSocialPosts } from "@/app/actions/social"
import SocialClient from "./SocialClient"

export default async function SocialPage() {
  const session = await getSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const agencyId = "agency-1" // Mock agency ID

  const accountsRes = await getSocialAccounts(agencyId)
  const postsRes = await getSocialPosts(agencyId)

  const initialAccounts = accountsRes.success && accountsRes.accounts ? accountsRes.accounts : []
  const initialPosts = postsRes.success && postsRes.posts ? postsRes.posts : []

  return <SocialClient initialAccounts={initialAccounts} initialPosts={initialPosts} agencyId={agencyId} />
}
