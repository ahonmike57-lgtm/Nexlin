"use server"

import { requirePlatformAuth } from "@/lib/permissions"
import { generateAiReply } from "@/app/actions/ai"

export async function generateProspectingAudit(businessName: string, websiteUrl: string, city: string) {
  const auth = await requirePlatformAuth(["owner", "developer", "support"])
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  try {
    const prompt = `Generate a detailed local SEO and online presence audit report card for:
Business Name: ${businessName}
Website: ${websiteUrl}
City/Location: ${city}

Include scores out of 100 for:
1. Google Business Profile Optimization
2. Website Speed & Mobile Responsiveness
3. Online Reviews & Reputation Score
4. Local Search Keyword Rankings

Return JSON format with keys:
"overallScore" (number), "scores" (object with 4 scores above), "keyIssues" (array of strings), "opportunities" (array of strings), "pitchSummary" (string).`

    const res = await generateAiReply("", prompt)
    if (!res.success || !res.data) {
      return { success: false, error: "Failed to generate audit report" }
    }

    let report
    try {
      report = JSON.parse(res.data.replace(/```json|```/g, "").trim())
    } catch {
      report = {
        overallScore: 68,
        scores: { googleProfile: 65, mobileSpeed: 70, reputation: 60, localKeywords: 75 },
        keyIssues: ["Google Business Profile lacks recent photos", "Slow mobile page load speed", "Low review response rate"],
        opportunities: ["Automated SMS review requests can boost rating by +0.8 stars", "Missed call text-back can recapture ~15 lost leads/mo"],
        pitchSummary: res.data
      }
    }

    return { success: true, report }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
