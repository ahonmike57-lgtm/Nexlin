"use client"

import { UnifiedWebsiteBuilder, type BuilderSite } from "@/components/builder/UnifiedWebsiteBuilder"

export default function FunnelBuilderClient({ funnel }: { funnel: BuilderSite }) {
  return <UnifiedWebsiteBuilder initialSite={funnel} backHref="/funnels" />
}
