"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { getOrCreateAgency } from "./agency"
import { revalidatePath } from "next/cache"

export type DemoPresetKey = "dental" | "real_estate" | "b2b_saas" | "home_services"

interface PresetConfig {
  name: string
  pipelineName: string
  stages: Array<{ name: string; color: string; order: number }>
  contacts: Array<{
    firstName: string
    lastName: string
    email: string
    phone: string
    company: string
    leadScore: number
    tags: string
    dealTitle: string
    dealValue: number
    stageIndex: number
    conversationChannel?: "sms" | "email"
    conversationMessages?: Array<{ isOutbound: boolean; content: string }>
    hasAppointment?: boolean
    appointmentTitle?: string
    appointmentOffsetHours?: number
  }>
  workflowName: string
}

const DEMO_PRESETS: Record<DemoPresetKey, PresetConfig> = {
  dental: {
    name: "Dental & Aesthetic MedSpa",
    pipelineName: "Patient Acquisition & Treatment Funnel",
    stages: [
      { name: "New Patient Inquiries", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", order: 0 },
      { name: "Consultation Booked", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", order: 1 },
      { name: "Treatment Plan Proposed", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", order: 2 },
      { name: "Insurance & Financing Approved", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30", order: 3 },
      { name: "Procedure Scheduled / Won", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", order: 4 }
    ],
    contacts: [
      {
        firstName: "Sophia",
        lastName: "Martinez",
        email: "sophia.martinez@example.com",
        phone: "+1 (555) 234-8901",
        company: "Self / Private Patient",
        leadScore: 94,
        tags: "all-on-4,dental-implants,vip,demo-accelerator",
        dealTitle: "Full Arch All-On-4 Implant Restoration",
        dealValue: 24500,
        stageIndex: 3,
        conversationChannel: "sms",
        conversationMessages: [
          { isOutbound: false, content: "Hi! I submitted a form about the full arch implant procedure. Do you offer financing?" },
          { isOutbound: true, content: "Hello Sophia! Yes, we offer 0% APR financing for up to 24 months. We have a consultation slot open tomorrow at 2:00 PM. Would you like Dr. Vance to review your 3D scans?" },
          { isOutbound: false, content: "Yes please, 2:00 PM works perfectly!" },
          { isOutbound: true, content: "You're all set! We just emailed your medical intake forms and added your visit to our VIP calendar." }
        ],
        hasAppointment: true,
        appointmentTitle: "Sophia Martinez - All-On-4 3D Scan & Financing Review",
        appointmentOffsetHours: 24
      },
      {
        firstName: "Marcus",
        lastName: "Sterling",
        email: "m.sterling@investcorp.com",
        phone: "+1 (555) 789-1022",
        company: "Sterling Holdings",
        leadScore: 88,
        tags: "invisalign,cosmetic,demo-accelerator",
        dealTitle: "Comprehensive Invisalign + Whitening Package",
        dealValue: 5800,
        stageIndex: 1,
        hasAppointment: true,
        appointmentTitle: "Marcus Sterling - Cosmetic Smile Assessment",
        appointmentOffsetHours: 48
      },
      {
        firstName: "Amanda",
        lastName: "Chen",
        email: "amanda.chen@techventures.io",
        phone: "+1 (555) 456-7890",
        company: "Venture Partners",
        leadScore: 92,
        tags: "porcelain-veneers,high-intent,demo-accelerator",
        dealTitle: "8-Unit Porcelain Veneer Smile Makeover",
        dealValue: 16000,
        stageIndex: 2
      },
      {
        firstName: "Carlos",
        lastName: "Rodriguez",
        email: "carlos.r@globalbuild.net",
        phone: "+1 (555) 890-3412",
        company: "Global Construction",
        leadScore: 82,
        tags: "emergency,pain-relief,demo-accelerator",
        dealTitle: "Root Canal + Zirconia Crown Treatment",
        dealValue: 2900,
        stageIndex: 4
      },
      {
        firstName: "Jessica",
        lastName: "Taylor",
        email: "jess.taylor@designstudios.com",
        phone: "+1 (555) 321-6547",
        company: "Studio Taylor",
        leadScore: 76,
        tags: "hygiene,teeth-whitening,demo-accelerator",
        dealTitle: "Laser Teeth Whitening + Deep Cleaning",
        dealValue: 850,
        stageIndex: 0
      }
    ],
    workflowName: "24/7 Dental AI Lead Porter & SMS Intake"
  },
  real_estate: {
    name: "Luxury Real Estate & Acquisitions",
    pipelineName: "High-Ticket Property Sales Pipeline",
    stages: [
      { name: "New Buyer / Seller Inquiries", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", order: 0 },
      { name: "Proof of Funds Verified", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", order: 1 },
      { name: "Private Showing Scheduled", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", order: 2 },
      { name: "Contract / Offer Submitted", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30", order: 3 },
      { name: "Closed Escrow / Commission Won", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", order: 4 }
    ],
    contacts: [
      {
        firstName: "Arthur",
        lastName: "Pendleton",
        email: "pendleton.family@luxestate.com",
        phone: "+1 (555) 888-9901",
        company: "Pendleton Family Trust",
        leadScore: 97,
        tags: "cash-buyer,waterfront,demo-accelerator",
        dealTitle: "The Cove Waterfront Estate (Acquisition)",
        dealValue: 3450000,
        stageIndex: 3,
        conversationChannel: "sms",
        conversationMessages: [
          { isOutbound: false, content: "Hello! We reviewed the drone tour of 42 Harbor Point. We'd like to submit an all-cash offer." },
          { isOutbound: true, content: "Mr. Pendleton, wonderful news. I have our CPQ deal room prepared with the purchase contract and seller disclosures. Sending the review link now." },
          { isOutbound: false, content: "Reviewed and digital signature applied. Wire instructions verified." }
        ],
        hasAppointment: true,
        appointmentTitle: "Arthur Pendleton - Closing Walkthrough & Escrow Review",
        appointmentOffsetHours: 72
      },
      {
        firstName: "Victoria",
        lastName: "Kensington",
        email: "v.kensington@hedgecap.com",
        phone: "+1 (555) 345-6712",
        company: "Kensington Capital",
        leadScore: 91,
        tags: "penthouse,investor,demo-accelerator",
        dealTitle: "TriBeCa Modern Sky Penthouse",
        dealValue: 1850000,
        stageIndex: 2,
        hasAppointment: true,
        appointmentTitle: "Victoria Kensington - Private Sunset Penthouse Showing",
        appointmentOffsetHours: 36
      },
      {
        firstName: "Dmitri",
        lastName: "Volkov",
        email: "volkov@novatech.ch",
        phone: "+1 (555) 901-2345",
        company: "Volkov Enterprises",
        leadScore: 85,
        tags: "commercial,retail-center,demo-accelerator",
        dealTitle: "Northgate Plaza Mixed-Use Commercial Strip",
        dealValue: 5200000,
        stageIndex: 1
      },
      {
        firstName: "Rachel",
        lastName: "Greenfield",
        email: "rachel.g@greenfield.io",
        phone: "+1 (555) 678-9012",
        company: "Greenfield Media",
        leadScore: 80,
        tags: "first-time-luxury,jumbo-loan,demo-accelerator",
        dealTitle: "Hillside Modern Smart Villa",
        dealValue: 1250000,
        stageIndex: 0
      }
    ],
    workflowName: "Luxury Buyer Instant VIP Concierge Routing"
  },
  b2b_saas: {
    name: "B2B SaaS & Growth Marketing Agency",
    pipelineName: "Enterprise Client Acquisition Pipeline",
    stages: [
      { name: "Inbound Marketing Qualified (MQL)", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", order: 0 },
      { name: "Discovery Call Completed", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", order: 1 },
      { name: "CPQ Proposal Sent ($5k-$20k/mo)", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", order: 2 },
      { name: "Legal & Security Review", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30", order: 3 },
      { name: "Signed Retainer Won", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", order: 4 }
    ],
    contacts: [
      {
        firstName: "Liam",
        lastName: "O'Connor",
        email: "liam@cloudscale.io",
        phone: "+1 (555) 432-8765",
        company: "CloudScale Systems",
        leadScore: 96,
        tags: "enterprise-saas,annual-retainer,demo-accelerator",
        dealTitle: "CloudScale - Autonomous AI SDR & Inbound Funnel Retainer",
        dealValue: 72000,
        stageIndex: 2,
        conversationChannel: "email",
        conversationMessages: [
          { isOutbound: false, content: "We need an integrated agency operating system that replaces our HubSpot and Twilio setup. Can we schedule an onboarding deep dive?" },
          { isOutbound: true, content: "Hi Liam, absolutely. Our multi-tenant architecture migrates all your sub-accounts with 0% carrier markup. Here is our interactive CPQ proposal for the Enterprise Tier." },
          { isOutbound: false, content: "The numbers look fantastic. We're reviewing with our VP of Ops today." }
        ],
        hasAppointment: true,
        appointmentTitle: "CloudScale Systems - Executive CPQ Review & Onboarding",
        appointmentOffsetHours: 20
      },
      {
        firstName: "Seraphina",
        lastName: "Blake",
        email: "s.blake@luminanceai.com",
        phone: "+1 (555) 654-3210",
        company: "Luminance AI",
        leadScore: 90,
        tags: "growth-tier,paid-media,demo-accelerator",
        dealTitle: "Luminance AI - Full-Funnel Performance Marketing",
        dealValue: 36000,
        stageIndex: 3
      },
      {
        firstName: "Devon",
        lastName: "Miller",
        email: "devon@apexlogistics.com",
        phone: "+1 (555) 789-4321",
        company: "Apex Logistics",
        leadScore: 84,
        tags: "telephony-migration,custom-crm,demo-accelerator",
        dealTitle: "Apex Logistics - Omnichannel Dispatch System",
        dealValue: 48000,
        stageIndex: 4
      },
      {
        firstName: "Chloe",
        lastName: "Bennett",
        email: "chloe@zenithhealth.org",
        phone: "+1 (555) 123-9876",
        company: "Zenith Health Tech",
        leadScore: 78,
        tags: "inbound-trial,demo-accelerator",
        dealTitle: "Zenith Health - AI Receptionist Pilot",
        dealValue: 14500,
        stageIndex: 1,
        hasAppointment: true,
        appointmentTitle: "Zenith Health - Technical Architecture Walkthrough",
        appointmentOffsetHours: 50
      }
    ],
    workflowName: "MQL Inbound Auto-Enrichment & Sales Rep Notification"
  },
  home_services: {
    name: "Roofing, Solar & Home Services",
    pipelineName: "Residential & Commercial Contracting Funnel",
    stages: [
      { name: "Emergency Inbound Inquiries", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", order: 0 },
      { name: "Drone / On-Site Inspection", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", order: 1 },
      { name: "Insurance Scope / Estimate Delivered", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", order: 2 },
      { name: "Insurance Adjuster Approved", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30", order: 3 },
      { name: "Roof Replacement Scheduled / Paid", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", order: 4 }
    ],
    contacts: [
      {
        firstName: "Brandon",
        lastName: "Cooper",
        email: "bcooper@cooperholdings.com",
        phone: "+1 (555) 987-1234",
        company: "Cooper Properties",
        leadScore: 95,
        tags: "hail-damage,commercial-roofing,demo-accelerator",
        dealTitle: "Commercial Warehouse 40,000 sq ft TPO Roof Replacement",
        dealValue: 128000,
        stageIndex: 3,
        conversationChannel: "sms",
        conversationMessages: [
          { isOutbound: false, content: "We had storm damage on our warehouse building yesterday. Can you send someone for an emergency drone roof inspection?" },
          { isOutbound: true, content: "Hi Brandon! Our inspection team is dispatched in your area. We have an inspector scheduled to fly the property tomorrow at 10 AM. You will receive real-time infrared thermal imaging." },
          { isOutbound: false, content: "Excellent. Send the report directly to my email as well." }
        ],
        hasAppointment: true,
        appointmentTitle: "Brandon Cooper - Drone Thermal Roof Inspection",
        appointmentOffsetHours: 16
      },
      {
        firstName: "Heather",
        lastName: "Walsh",
        email: "heather.walsh@valleyhome.com",
        phone: "+1 (555) 432-1098",
        company: "Residential Client",
        leadScore: 89,
        tags: "solar-shingles,residential,demo-accelerator",
        dealTitle: "Architectural Shingle + Tesla Solar Roof Upgrade",
        dealValue: 34000,
        stageIndex: 2
      },
      {
        firstName: "Tyler",
        lastName: "Jenkins",
        email: "tyler.jenkins@ranchliving.net",
        phone: "+1 (555) 876-5432",
        company: "Jenkins Ranch",
        leadScore: 83,
        tags: "metal-roof,insurance-claim,demo-accelerator",
        dealTitle: "Standing Seam Metal Roof Installation",
        dealValue: 42000,
        stageIndex: 4,
        hasAppointment: true,
        appointmentTitle: "Tyler Jenkins - Final Project Walkthrough & Sign-Off",
        appointmentOffsetHours: 64
      }
    ],
    workflowName: "Storm Damage Instant SMS & Drone Dispatch Workflow"
  }
}

export async function seedDemoAgencyData(presetKey: DemoPresetKey) {
  try {
    const session = await getSession().catch(() => null)
    const agencyId = (session?.user as any)?.agencyId || await getOrCreateAgency()
    const preset = DEMO_PRESETS[presetKey]

    if (!preset) {
      return { success: false, error: "Invalid preset selected" }
    }

    // 1. Clean existing demo-accelerator data for this agency to prevent duplicate accumulation
    await resetDemoAgencyDataInternal(agencyId)

    // 2. Create the specialized Pipeline
    const pipeline = await db.pipeline.create({
      data: {
        agencyId,
        name: preset.pipelineName,
        stages: {
          create: preset.stages.map(s => ({
            name: s.name,
            color: s.color,
            order: s.order
          }))
        }
      },
      include: { stages: true }
    })

    const stageMap = new Map<number, string>()
    pipeline.stages.forEach(s => stageMap.set(s.order, s.id))

    // 3. Create Contacts, Deals, Conversations, and Appointments
    let createdContactsCount = 0
    let createdDealsCount = 0
    let createdApptsCount = 0

    const now = new Date()

    for (const c of preset.contacts) {
      const stageId = stageMap.get(c.stageIndex) || pipeline.stages[0]?.id
      const stageName = preset.stages[c.stageIndex]?.name || "New Lead"

      // Create Contact
      const contact = await db.contact.create({
        data: {
          agencyId,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          company: c.company,
          leadScore: c.leadScore,
          tags: c.tags
        }
      })
      createdContactsCount++

      // Create Deal associated with Contact and Pipeline
      await db.deal.create({
        data: {
          agencyId,
          contactId: contact.id,
          pipelineId: pipeline.id,
          stageId,
          title: c.dealTitle,
          value: c.dealValue,
          stage: stageName
        }
      })
      createdDealsCount++

      // Create Conversation & Messages if configured
      if (c.conversationMessages && c.conversationMessages.length > 0) {
        const conv = await db.conversation.create({
          data: {
            agencyId,
            contactId: contact.id,
            channel: c.conversationChannel || "sms",
            status: "open",
            aiAutoReply: true
          }
        })

        for (let i = 0; i < c.conversationMessages.length; i++) {
          const msg = c.conversationMessages[i]
          await db.message.create({
            data: {
              conversationId: conv.id,
              isOutbound: msg.isOutbound,
              content: msg.content,
              status: "delivered",
              createdAt: new Date(now.getTime() - (c.conversationMessages.length - i) * 12 * 60 * 1000)
            }
          })
        }
      }

      // Create Appointment if configured
      if (c.hasAppointment && c.appointmentTitle) {
        const start = new Date(now.getTime() + (c.appointmentOffsetHours || 24) * 3600 * 1000)
        const end = new Date(start.getTime() + 45 * 60 * 1000) // 45 min slot

        await db.appointment.create({
          data: {
            agencyId,
            contactId: contact.id,
            title: c.appointmentTitle,
            startTime: start,
            endTime: end
          }
        })
        createdApptsCount++
      }
    }

    // 4. Create sample Automation Workflow if not exists
    await db.workflow.create({
      data: {
        agencyId,
        name: `[Demo] ${preset.workflowName}`,
        status: "active"
      }
    }).catch(() => {})

    // Revalidate paths across the CRM
    revalidatePath("/crm/deals")
    revalidatePath("/crm/contacts")
    revalidatePath("/calendar")
    revalidatePath("/chat")
    revalidatePath("/dashboard")

    return {
      success: true,
      presetName: preset.name,
      stats: {
        contacts: createdContactsCount,
        deals: createdDealsCount,
        appointments: createdApptsCount,
        pipeline: preset.pipelineName
      }
    }
  } catch (error: any) {
    console.error("Error seeding demo agency data:", error)
    return { success: false, error: error.message || "Failed to load demo accelerator" }
  }
}

async function resetDemoAgencyDataInternal(agencyId: string) {
  // Find all contacts created by the demo accelerator
  const demoContacts = await db.contact.findMany({
    where: {
      agencyId,
      tags: { contains: "demo-accelerator" }
    },
    select: { id: true }
  })

  const contactIds = demoContacts.map(c => c.id)

  if (contactIds.length > 0) {
    // Delete associated appointments
    await db.appointment.deleteMany({
      where: { contactId: { in: contactIds }, agencyId }
    })

    // Delete associated deals
    await db.deal.deleteMany({
      where: { contactId: { in: contactIds }, agencyId }
    })

    // Delete associated conversations & messages
    const convs = await db.conversation.findMany({
      where: { contactId: { in: contactIds }, agencyId },
      select: { id: true }
    })
    const convIds = convs.map(c => c.id)
    if (convIds.length > 0) {
      await db.message.deleteMany({
        where: { conversationId: { in: convIds } }
      })
      await db.conversation.deleteMany({
        where: { id: { in: convIds } }
      })
    }

    // Delete the contacts
    await db.contact.deleteMany({
      where: { id: { in: contactIds } }
    })
  }

  // Delete demo pipelines
  await db.pipeline.deleteMany({
    where: {
      agencyId,
      name: { in: Object.values(DEMO_PRESETS).map(p => p.pipelineName) }
    }
  })

  // Delete demo workflows
  await db.workflow.deleteMany({
    where: {
      agencyId,
      name: { startsWith: "[Demo]" }
    }
  })
}

export async function resetDemoAgencyData() {
  try {
    const session = await getSession().catch(() => null)
    const agencyId = (session?.user as any)?.agencyId || await getOrCreateAgency()

    await resetDemoAgencyDataInternal(agencyId)

    revalidatePath("/crm/deals")
    revalidatePath("/crm/contacts")
    revalidatePath("/calendar")
    revalidatePath("/chat")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reset demo data" }
  }
}

export async function getDemoSeedStatus() {
  try {
    const session = await getSession().catch(() => null)
    const agencyId = (session?.user as any)?.agencyId || await getOrCreateAgency()

    const demoCount = await db.contact.count({
      where: {
        agencyId,
        tags: { contains: "demo-accelerator" }
      }
    })

    return {
      success: true,
      hasDemoData: demoCount > 0,
      demoContactCount: demoCount
    }
  } catch {
    return { success: true, hasDemoData: false, demoContactCount: 0 }
  }
}
