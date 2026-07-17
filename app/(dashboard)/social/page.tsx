export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getOrCreateAgency } from "@/app/actions/agency"
import SocialClient from "./SocialClient"
import { getSocialAccounts, getSocialPosts } from "@/app/actions/social"

export default async function SocialPage() {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")

  const agencyId = await getOrCreateAgency()
  const accountsRes = await getSocialAccounts(agencyId)
  const postsRes = await getSocialPosts(agencyId)

  const initialAccounts = accountsRes.success && accountsRes.accounts ? accountsRes.accounts : []
  const initialPosts = postsRes.success && postsRes.posts ? postsRes.posts : []

  return <SocialClient initialAccounts={initialAccounts} initialPosts={initialPosts} agencyId={agencyId} />
}
