"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle2, Loader2, ArrowLeft } from "lucide-react"
import { Suspense, useState } from "react"
import { processMockSubscription } from "@/app/actions/billing"

function MockCheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get("plan") || "Unknown"
  const provider = searchParams.get("provider") || "stripe"
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSimulatePayment = async () => {
    setIsProcessing(true)
    
    // Simulate network delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const res = await processMockSubscription("agency-1", plan)
    
    if (res.success) {
      setIsSuccess(true)
      setTimeout(() => {
        router.push("/settings/billing")
      }, 2000)
    } else {
      setIsProcessing(false)
      alert("Payment failed")
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">MOCK CHECKOUT</CardTitle>
          <CardDescription>
            Simulating {provider === 'stripe' ? 'Stripe (Global)' : 'Paystack (Africa)'} Checkout
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center animate-in zoom-in duration-500">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center text-success">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold">Payment Successful!</h2>
              <p className="text-text-secondary">Your {plan} subscription is now active.</p>
              <p className="text-xs text-text-secondary mt-4">Redirecting back to billing...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-bg-secondary p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold">{plan} Plan</p>
                  <p className="text-xs text-text-secondary">Billed monthly</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl">
                    {plan === 'Starter' ? '$97' : plan === 'Pro' ? '$297' : plan === 'Enterprise' ? '$497' : '$0'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="border border-dashed border-border rounded-lg p-6 text-center text-text-secondary bg-bg-secondary/50">
                  <p className="text-sm font-medium mb-1">Testing Mode Active</p>
                  <p className="text-xs">No real credit card is required. Click below to simulate a successful transaction via {provider}.</p>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => router.back()} disabled={isProcessing}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                  <Button className="flex-1 bg-primary text-white" onClick={handleSimulatePayment} disabled={isProcessing}>
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      "Simulate Success"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function MockCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center p-4">Loading...</div>}>
      <MockCheckoutContent />
    </Suspense>
  )
}
