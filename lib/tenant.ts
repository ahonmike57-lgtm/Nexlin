import { db } from "@/lib/db"
import { requireTenantAuth, type TenantRole } from "@/lib/permissions"

/**
 * Models carrying an `agencyId` column. Queries against these are automatically
 * constrained to the caller's agency by `tenantDb()`. Models absent from this
 * set pass through unscoped — keep it in sync with prisma/schema.prisma.
 */
const AGENCY_SCOPED_MODELS = new Set([
  "SubAgency", "User", "Contact", "Deal", "Pipeline", "Subscription", "Funnel",
  "Conversation", "Campaign", "Workflow", "Appointment", "PhoneNumber",
  "PortRequest", "Ticket", "KnowledgeArticle", "VoiceAgent", "SocialAccount",
  "SocialPost", "AdCampaign", "Review", "ReviewRequest", "Form", "FormSubmission",
  "MediaFile", "Webhook", "McpConnection", "TenantApp", "Snapshot", "BillingWallet",
  "RebillingMarkup", "Affiliate", "AiSettings", "ImpersonationLog", "ApiKey",
  "WebhookDelivery", "ForgeSite",
])

// Operations whose `where` is a unique selector — agencyId cannot be merged in,
// so reads are verified after the fact and writes are refused.
const UNIQUE_READS = new Set(["findUnique", "findUniqueOrThrow"])
const UNIQUE_WRITES = new Set(["update", "delete"])

// Operations that accept a general `where` filter.
const FILTERABLE = new Set([
  "findFirst", "findFirstOrThrow", "findMany", "count", "aggregate", "groupBy",
  "updateMany", "deleteMany",
])

/**
 * A Prisma client locked to a single agency.
 *
 * Every filterable query gains `where.agencyId`, and every create gains
 * `data.agencyId`. A forgotten filter therefore returns nothing rather than
 * another tenant's rows — the failure mode is empty, not a leak.
 */
export function tenantDb(agencyId: string) {
  return db.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          if (!AGENCY_SCOPED_MODELS.has(model)) {
            return query(args)
          }

          if (FILTERABLE.has(operation)) {
            return query({ ...args, where: { ...(args.where ?? {}), agencyId } })
          }

          if (operation === "create") {
            return query({ ...args, data: { ...(args.data ?? {}), agencyId } })
          }

          if (operation === "createMany") {
            const data = Array.isArray(args.data) ? args.data : [args.data]
            return query({ ...args, data: data.map((d: any) => ({ ...d, agencyId })) })
          }

          if (UNIQUE_READS.has(operation)) {
            // Fetch, then confirm ownership before handing the row back.
            const result = await query(args)
            if (result && result.agencyId !== agencyId) return null
            return result
          }

          if (UNIQUE_WRITES.has(operation)) {
            throw new Error(
              `tenantDb: "${operation}" on ${model} cannot be tenant-scoped safely. ` +
              `Use ${operation}Many with a where clause instead.`
            )
          }

          if (operation === "upsert") {
            return query({
              ...args,
              create: { ...(args.create ?? {}), agencyId },
              update: args.update,
            })
          }

          return query(args)
        },
      },
    },
  })
}

export interface TenantContext {
  /** Prisma client pre-scoped to this agency. Prefer it over the raw `db`. */
  db: ReturnType<typeof tenantDb>
  agencyId: string
  userId: string
  userRole: string
  isTenantAdmin: boolean
  isImpersonating: boolean
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Wraps a server action so it only ever runs for an authenticated tenant user.
 *
 * Server actions compile to public HTTP endpoints — anything not wrapped in an
 * authorization check is callable by anyone who reads the client bundle.
 *
 *   export const listDeals = withAgency(async ({ db }) =>
 *     db.deal.findMany({ orderBy: { createdAt: "desc" } })
 *   )
 */
export function withAgency<TArgs extends any[], TResult>(
  handler: (ctx: TenantContext, ...args: TArgs) => Promise<TResult>,
  options: { role?: TenantRole } = {}
) {
  return async (...args: TArgs): Promise<ActionResult<TResult>> => {
    const auth = await requireTenantAuth(options.role ?? "user")

    if (!auth.authorized) {
      return { success: false, error: auth.error }
    }

    try {
      const data = await handler(
        {
          db: tenantDb(auth.agencyId),
          agencyId: auth.agencyId,
          userId: auth.userId,
          userRole: auth.userRole,
          isTenantAdmin: auth.isTenantAdmin,
          isImpersonating: auth.isImpersonating,
        },
        ...args
      )
      return { success: true, data }
    } catch (error: any) {
      // Log internally, return an opaque message — Prisma errors echo schema details.
      console.error("Action error:", error)
      return { success: false, error: "Request failed" }
    }
  }
}
