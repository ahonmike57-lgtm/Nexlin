export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import CalendarClient from "./CalendarClient"
import { startOfWeek, endOfWeek, addDays, format } from "date-fns"
import { getActiveSubAccountId } from "@/app/actions/subaccounts"

export default async function CalendarPage() {
  const session = await getSession()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { agency: true },
  })

  if (!user?.agencyId) {
    return <div className="p-8">No agency found. Please complete onboarding.</div>
  }

  // Fetch this week's appointments
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  const endDate = endOfWeek(new Date(), { weekStartsOn: 1 })

  const subAgencyId = await getActiveSubAccountId()
  const whereClause: any = {
    agencyId: user.agencyId,
    startTime: {
      gte: startDate,
      lte: endDate,
    }
  }
  const contactWhereClause: any = { agencyId: user.agencyId }
  
  if (subAgencyId) {
    whereClause.subAgencyId = subAgencyId
    contactWhereClause.subAgencyId = subAgencyId
  }

  const appointments = await db.appointment.findMany({
    where: whereClause,
    include: {
      contact: true
    },
    orderBy: {
      startTime: "asc"
    }
  })

  // Fetch contacts for the new appointment dropdown
  const contacts = await db.contact.findMany({
    where: contactWhereClause,
    select: { id: true, firstName: true, lastName: true }
  })

  return (
    <div className="h-full flex flex-col p-8 bg-bg-secondary">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Calendar</h1>
          <p className="text-text-secondary mt-1">Manage your team's schedule and bookings.</p>
        </div>
      </div>
      
      <CalendarClient initialAppointments={appointments} contacts={contacts} agencyId={user.agencyId} />
    </div>
  )
}

