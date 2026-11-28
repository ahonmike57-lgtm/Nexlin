import { notFound } from "next/navigation"
import { getPublicAgencyForReview } from "@/app/actions/reputation"
import ReviewFormClient from "./ReviewFormClient"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ agencyId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { agencyId } = await params
  const agency = await getPublicAgencyForReview(agencyId)
  if (!agency) {
    return { title: "Review Page Not Found | Nexlin" }
  }
  return {
    title: `Leave a Review | ${agency.name}`,
    description: `Share your feedback about your experience with ${agency.name}.`,
  }
}

export default async function PublicReviewPage({ params }: Props) {
  const { agencyId } = await params
  const agency = await getPublicAgencyForReview(agencyId)

  if (!agency) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg">
        <ReviewFormClient agency={agency} />
      </div>
    </div>
  )
}
