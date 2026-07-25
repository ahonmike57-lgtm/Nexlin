import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import { 
  executeWorkflowEngine, 
  cronReviewRequests, 
  cronUsageRebillingSync 
} from "@/lib/inngest/functions"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    executeWorkflowEngine,
    cronReviewRequests,
    cronUsageRebillingSync
  ],
})
