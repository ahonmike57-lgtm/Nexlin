"use server"

import { withAgency } from "@/lib/tenant"

// Email templates are stored as Campaigns with status="template"
// so they share the Campaign model without needing a new Prisma model.

export const saveEmailTemplate = withAgency(
  async (
    { db, agencyId },
    data: { name: string; subject: string; content: string }
  ) => {
    return db.campaign.create({
      data: {
        agencyId,
        name: data.name,
        subject: data.subject,
        content: data.content,
        status: "template",
      },
    })
  }
)

export const getEmailTemplates = withAgency(async ({ db }) => {
  return db.campaign.findMany({
    where: { status: "template" },
    orderBy: { createdAt: "desc" },
  })
})

export const deleteEmailTemplate = withAgency(
  async ({ db }, campaignId: string) => {
    return db.campaign.deleteMany({ where: { id: campaignId } })
  }
)
