import { notFound } from "next/navigation"
import { getLiveFunnelStep } from "@/app/actions/funnels"
import LiveFunnelClient from "./[slug]/LiveFunnelClient"

export default async function LiveFunnelBasePage({
  params
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  
  const response = await getLiveFunnelStep(subdomain, "home")
  
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
