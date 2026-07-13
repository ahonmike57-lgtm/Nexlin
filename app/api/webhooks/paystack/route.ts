import { NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("x-paystack-signature")

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return new NextResponse("Missing PAYSTACK_SECRET_KEY", { status: 400 })
  }

  // Verify Paystack Signature
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(body).digest('hex')
  if (hash !== sig) {
    return new NextResponse("Invalid Signature", { status: 401 })
  }

  const event = JSON.parse(body)

  switch (event.event) {
    case "charge.success":
      // Example: Update DB when payment is successful
      console.log(`Paystack payment successful: ${event.data.reference}`)
      break
    case "subscription.create":
      console.log(`Paystack subscription created`)
      break
    default:
      console.log(`Unhandled paystack event type ${event.event}`)
  }

  return new NextResponse(null, { status: 200 })
}
