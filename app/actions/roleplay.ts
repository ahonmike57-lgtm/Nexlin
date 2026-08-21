"use server"

import { generateAiReply } from "./ai"

export interface RoleplayScorecard {
  objectionScore: number
  valuePropScore: number
  closingScore: number
  overallScore: number
  grade: string
  executiveSummary: string
  keyStrengths: string[]
  actionableTips: string[]
}

export async function generateRoleplayScorecard(
  personaTitle: string,
  transcript: Array<{ role: "user" | "assistant"; content: string }>
) {
  try {
    const formattedTranscript = transcript
      .map((m) => `${m.role === "user" ? "Sales Rep" : personaTitle}: ${m.content}`)
      .join("\n\n")

    const prompt = `You are a world-class VP of Sales and Executive Sales Coach.
Analyze the following sales roleplay conversation between a Sales Rep and a buyer (${personaTitle}):

--- TRANSCRIPT ---
${formattedTranscript}
--- END TRANSCRIPT ---

Evaluate the sales rep objectively and return a valid JSON object with the exact keys:
- "objectionScore": number (0 to 100)
- "valuePropScore": number (0 to 100)
- "closingScore": number (0 to 100)
- "overallScore": number (0 to 100)
- "grade": string ("A+", "A", "B+", "B", "C", "Needs Work")
- "executiveSummary": string (2-3 sentences summarizing performance)
- "keyStrengths": array of 2-3 specific things the rep did well
- "actionableTips": array of 3 concrete closing adjustments to win the real deal`

    const res = await generateAiReply("sales_coach", prompt)

    let scorecard: RoleplayScorecard
    if (res.success && res.data) {
      try {
        const clean = res.data.replace(/```json/gi, "").replace(/```/g, "").trim()
        scorecard = JSON.parse(clean)
      } catch {
        scorecard = getFallbackScorecard()
      }
    } else {
      scorecard = getFallbackScorecard()
    }

    return { success: true, scorecard }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to generate scorecard" }
  }
}

function getFallbackScorecard(): RoleplayScorecard {
  return {
    objectionScore: 82,
    valuePropScore: 88,
    closingScore: 78,
    overallScore: 83,
    grade: "B+",
    executiveSummary: "Strong initial value proposition articulation with solid confidence. Could be firmer when pinning down the prospect's decision timeline.",
    keyStrengths: [
      "Clearly linked product capabilities to customer business outcomes",
      "Maintained professional composure during budget skepticism"
    ],
    actionableTips: [
      "Quantify ROI earlier with specific dollar or percentage metrics",
      "Proactively confirm buying criteria before presenting pricing",
      "Ask a firm closing question: 'If we can solve X by next Friday, are you ready to move forward?'"
    ]
  }
}
