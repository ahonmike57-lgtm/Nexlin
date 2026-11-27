import { describe, expect, it } from "vitest"
import { interpolateMergeTags } from "@/lib/merge-tags"

describe("lib/merge-tags", () => {
  it("interpolates contact, agency, currency deal, custom, and fallback tags", () => {
    const output = interpolateMergeTags(
      "Hi {{contact.fullName}} at {{agency.name}}! Deal: {{deal.value | currency}} in {{custom.workflow.name}}. Fallback: {{contact.company | 'Independent'}}",
      {
        contact: { firstName: "Ada", lastName: "Lovelace", company: null },
        agency: { name: "Nexlin Digital" },
        deal: { value: 2500 },
        customValues: { "workflow.name": "VIP Onboarding" },
      }
    )

    expect(output).toBe(
      "Hi Ada Lovelace at Nexlin Digital! Deal: $2,500.00 in VIP Onboarding. Fallback: Independent"
    )
  })

  it("supports missing context fallback cleanly", () => {
    expect(interpolateMergeTags("Hi {{contact.firstName | 'there'}}")).toBe("Hi there")
    expect(interpolateMergeTags("")).toBe("")
  })
})
