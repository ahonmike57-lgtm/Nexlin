import { notFound } from "next/navigation"
import { getLiveFunnelStep } from "@/app/actions/funnels"
import LiveFunnelClient from "./LiveFunnelClient"

export default async function LiveFunnelPage({
  params
}: {
  params: Promise<{ subdomain: string; slug: string }>
}) {
  const { subdomain, slug } = await params
  
  const response = await getLiveFunnelStep(subdomain, slug)
  
  if (!response.success || !response.data) {
    return notFound()
  }

  const { funnel, step } = response.data

  return (
    <LiveFunnelClient 
      funnel={funnel} 
      step={step} 
      subdomain={subdomain} 
    />
  )
}
