import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getLiveFunnelStep } from "@/app/actions/funnels"
import LiveFunnelClient from "./[slug]/LiveFunnelClient"

function extractSeoMeta(step: { name: string; config?: string | null }, funnelName: string) {
  let seoTitle = `${step.name} | ${funnelName}`
  let seoDescription = `Official page for ${funnelName}`
  if (step.config) {
    try {
      const parsed = JSON.parse(step.config)
      if (parsed.seoTitle) seoTitle = String(parsed.seoTitle)
      if (parsed.seoDescription) seoDescription = String(parsed.seoDescription)
    } catch {}
  }
  return { title: seoTitle, description: seoDescription }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>
}): Promise<Metadata> {
  const { subdomain } = await params
  const response = await getLiveFunnelStep(subdomain, "home")
  if (!response.success || !response.data) {
    return { title: "Page Not Found" }
  }
  return extractSeoMeta(response.data.step, response.data.funnel.name)
}

export default async function LiveFunnelBasePage({
  params,
}: {
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params

  const response = await getLiveFunnelStep(subdomain, "home")

  if (!response.success || !response.data) {
    return notFound()
  }

  const { funnel, step, pages } = response.data

  return (
    <LiveFunnelClient
      funnel={funnel}
      step={step}
      subdomain={subdomain}
      pages={pages}
    />
  )
}
