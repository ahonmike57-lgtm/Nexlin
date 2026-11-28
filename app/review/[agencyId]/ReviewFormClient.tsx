"use client"

import { useState } from "react"
import { Star, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { submitPublicReview } from "@/app/actions/reputation"

interface Props {
  agency: {
    id: string
    name: string
    logoUrl?: string | null
  }
}

export default function ReviewFormClient({ agency }: Props) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [authorName, setAuthorName] = useState("")
  const [email, setEmail] = useState("")
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await submitPublicReview(agency.id, {
        authorName,
        rating,
        comment,
        email,
      })
      if (res.success) {
        setSubmitted(true)
      } else {
        setError(res.error || "Unable to submit review. Please try again.")
      }
    } catch {
      setError("Network error while submitting your review.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card className="text-center shadow-xl">
        <CardContent className="pt-10 pb-10 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Thank You for Your Review!</h2>
          <p className="text-sm text-text-secondary max-w-sm mx-auto">
            Your feedback for <strong>{agency.name}</strong> has been recorded and means a lot to our team.
          </p>
        </CardContent>
      </Card>
    )
  }

  const activeStars = hoverRating || rating

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Review {agency.name}</CardTitle>
        <CardDescription>
          How was your experience? Select a rating and share a quick note below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2 text-center">
            <span className="text-xs font-medium uppercase tracking-wider text-text-secondary block">
              Your Rating
            </span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= activeStars
                        ? "fill-amber-400 text-amber-400"
                        : "text-text-secondary/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase text-text-secondary block">
              Your Name *
            </label>
            <Input
              required
              placeholder="Jane Doe"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase text-text-secondary block">
              Email (optional)
            </label>
            <Input
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase text-text-secondary block">
              Your Feedback
            </label>
            <textarea
              rows={4}
              placeholder="Share what stood out about working with our team..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full font-semibold">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
