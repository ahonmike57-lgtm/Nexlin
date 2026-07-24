import { getFeatureFlags } from "@/app/actions/feature-flags"
import FeatureFlagsClient from "./FeatureFlagsClient"

export default async function PlatformFeaturesPage() {
  const { flags } = await getFeatureFlags()

  return <FeatureFlagsClient initialFlags={flags || []} />
}
