import { db } from "@/lib/db"

/**
 * Dual Global Payments Architecture (Mock)
 * Routes payment actions to Stripe or Paystack based on user's geographic location.
 */

interface PaymentOptions {
  agencyId: string;
  isAfricaUser: boolean;
  email: string;
  planId: string;
  amount: number;
}

export async function createSubscription({ agencyId, isAfricaUser, email, planId, amount }: PaymentOptions) {
  
  // 1. Route to the appropriate gateway
  const gateway = isAfricaUser ? 'paystack' : 'stripe'
  console.log(`[PAYMENTS] Routing subscription for ${email} to ${gateway}...`)

  let processorSubscriptionId = ""
  let processorCustomerId = ""

  if (gateway === 'paystack') {
    // MOCK: Paystack API Call
    console.log("[PAYSTACK] Creating subscription...")
    processorCustomerId = `cus_ps_${Math.random().toString(36).substring(7)}`
    processorSubscriptionId = `sub_ps_${Math.random().toString(36).substring(7)}`
  } else {
    // MOCK: Stripe API Call
    console.log("[STRIPE] Creating subscription...")
    processorCustomerId = `cus_st_${Math.random().toString(36).substring(7)}`
    processorSubscriptionId = `sub_st_${Math.random().toString(36).substring(7)}`
  }

  // 2. Persist to our database
  const subscription = await db.subscription.create({
    data: {
      agencyId,
      paymentProcessor: gateway,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)), // +1 month
      stripeCustomerId: gateway === 'stripe' ? processorCustomerId : null,
      stripeSubscriptionId: gateway === 'stripe' ? processorSubscriptionId : null,
      paystackEmail: gateway === 'paystack' ? email : null,
      paystackCode: gateway === 'paystack' ? processorSubscriptionId : null,
    }
  })

  // 3. Create initial transaction record
  await db.paymentTransaction.create({
    data: {
      subscriptionId: subscription.id,
      amount: amount,
      currency: gateway === 'paystack' ? 'NGN' : 'USD',
      status: "succeeded",
      processor: gateway,
      processorTransactionId: `txn_${Math.random().toString(36).substring(7)}`,
      processedAt: new Date()
    }
  })

  return subscription
}
