import { Suspense } from "react"
import PromptsClient from "./PromptsClient"

export const metadata = {
  title: "Prompt Library | Nexlin",
  description: "Browse and use curated vibecode prompts to build CRM pages, emails, and automations",
}

export default function PromptsPage() {
  return (
    <Suspense>
      <PromptsClient />
    </Suspense>
  )
}
