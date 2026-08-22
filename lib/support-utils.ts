export interface TicketThreadMessage {
  id: string
  senderId: string
  senderName: string
  role: "agent" | "customer" | "system"
  isInternal: boolean
  content: string
  createdAt: string
}

export interface ParsedTicketData {
  text: string
  thread: TicketThreadMessage[]
}

export function parseTicketDescription(rawDescription: string | null): ParsedTicketData {
  if (!rawDescription) return { text: "", thread: [] }
  try {
    const parsed = JSON.parse(rawDescription)
    if (parsed && typeof parsed === "object" && "text" in parsed) {
      return {
        text: parsed.text || "",
        thread: Array.isArray(parsed.thread) ? parsed.thread : []
      }
    }
  } catch (e) {
    // If not JSON, treat as plain initial text
  }
  return { text: rawDescription, thread: [] }
}
