import { inngest } from "./client"
import { db } from "@/lib/db"

export const handleContactCreated = (inngest.createFunction as any)(
  { id: "handle-contact-created", event: "contact.created" },
  async ({ event, step }: { event: any; step: any }) => {
    const { contactId, agencyId } = event.data

    const contact = await step.run("fetch-contact", async () => {
      return await db.contact.findUnique({ where: { id: contactId } })
    })

    if (!contact) return { error: "Contact not found" }

    const workflows = await step.run("fetch-workflows", async () => {
      return await db.workflow.findMany({
        where: { agencyId, status: "active" },
        include: {
          triggers: true,
          actions: { orderBy: { order: "asc" } }
        }
      })
    })

    const matchingWorkflows = workflows.filter((wf: any) => 
      wf.triggers.some((t: any) => t.type === "contact_created")
    )

    for (const workflow of matchingWorkflows) {
      for (const action of workflow.actions) {
        if (action.type === "wait") {
          // If there's a wait action, we'd parse config. 
          // Defaulting to 1 day for demo.
          await step.sleep(`wait-for-${action.id}`, "1d")
        } else if (action.type === "send_email") {
          await step.run(`send-email-${action.id}`, async () => {
            // Here we would call Resend or similar
            console.log(`Sending email to ${contact.email} from workflow ${workflow.name}`)
          })
        }
      }
    }

    return { success: true, executedWorkflows: matchingWorkflows.length }
  }
)
