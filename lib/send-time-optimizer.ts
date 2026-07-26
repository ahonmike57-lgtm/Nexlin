/**
 * Predictive Send-Time Optimization (STO) Algorithm
 * Analyzes historical interaction timestamps to find the contact's optimal open minute.
 */

export function calculateOptimalSendTime(interactionTimestamps: string[]): { hour: number; minute: number } {
  if (!interactionTimestamps || interactionTimestamps.length === 0) {
    return { hour: 9, minute: 0 } // Default fallback 9:00 AM
  }

  const hourCounts: Record<number, number> = {}

  for (const ts of interactionTimestamps) {
    const d = new Date(ts)
    const hour = d.getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  }

  let bestHour = 9
  let maxCount = 0

  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > maxCount) {
      maxCount = count
      bestHour = Number(hour)
    }
  }

  return { hour: bestHour, minute: 15 }
}
