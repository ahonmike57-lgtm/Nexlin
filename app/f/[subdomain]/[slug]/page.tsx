import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getLiveFunnelStep } from "@/app/actions/funnels"
import LiveFunnelClient from "./LiveFunnelClient"

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
  params: Promise<{ subdomain: string; slug: string }>
}): Promise<Metadata> {
  const { subdomain, slug } = await params
  const response = await getLiveFunnelStep(subdomain, slug)
  if (!response.success || !response.data) {
    return { title: "Page Not Found" }
  }
  return extractSeoMeta(response.data.step, response.data.funnel.name)
}

export default async function LiveFunnelPage({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>
}) {
  const { subdomain, slug } = await params

  const response = await getLiveFunnelStep(subdomain, slug)

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
