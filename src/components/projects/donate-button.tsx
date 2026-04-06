"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { DONATIONS_ENABLED } from "@/lib/feature-flags"
import { toast } from "sonner"
import type { MicroDonationUnit } from "@/types/database"

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

type PaymentsConfig = { razorpay: boolean; stripe: boolean }

type Props = {
  projectId: string
  units: MicroDonationUnit[]
  /** When false, this campaign does not collect donations; render nothing. */
  fundingNeeded?: boolean
}

export function DonateButton({ projectId, units, fundingNeeded = true }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [payments, setPayments] = useState<PaymentsConfig | null>(null)
  const [step, setStep] = useState<"amount" | "method">("amount")
  const [pending, setPending] = useState<{ amount: number; label: string | null } | null>(null)

  useEffect(() => {
    if (!open) return
    fetch("/api/v1/payments/config")
      .then((r) => r.json())
      .then((d: PaymentsConfig) => setPayments(d))
      .catch(() => setPayments({ razorpay: false, stripe: false }))
  }, [open])

  useEffect(() => {
    if (!open) {
      setStep("amount")
      setPending(null)
    }
  }, [open])

  if (fundingNeeded === false) {
    return null
  }

  if (!DONATIONS_ENABLED) {
    return (
      <div className="flex flex-col gap-1">
        <Button size="lg" className="w-full sm:w-auto" type="button" disabled>
          Donate
        </Button>
        <p className="text-xs text-muted-foreground">Donations are temporarily unavailable.</p>
      </div>
    )
  }

  const loadScript = () =>
    new Promise<void>((resolve, reject) => {
      if (window.Razorpay) {
        resolve()
        return
      }
      const s = document.createElement("script")
      s.src = "https://checkout.razorpay.com/v1/checkout.js"
      s.onload = () => resolve()
      s.onerror = () => reject(new Error("Razorpay script failed"))
      document.body.appendChild(s)
    })

  async function payRazorpay(amount: number, label: string | null) {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      toast.message("Please log in to donate")
      router.push(`/login?next=/projects/${projectId}`)
      return
    }

    setLoading(true)
    try {
      if (!scriptLoaded) {
        await loadScript()
        setScriptLoaded(true)
      }

      const res = await fetch("/api/v1/payments/razorpay/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          projectId,
          amount,
          microUnitLabel: label,
        }),
      })
      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error ?? "Could not start payment")
      }

      const Razorpay = window.Razorpay
      if (!Razorpay) throw new Error("Razorpay unavailable")

      const rzp = new Razorpay({
        key: payload.keyId,
        amount: payload.amount,
        currency: payload.currency,
        order_id: payload.orderId,
        name: "ImpactBridge",
        description: label ?? "Impact donation",
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          const v = await fetch("/api/v1/payments/razorpay/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          })
          const vr = await v.json()
          if (!v.ok) {
            toast.error(vr.error ?? "Verification failed")
            return
          }
          toast.success("Thank you. Your impact is on its way.")
          setOpen(false)
          router.refresh()
        },
        theme: { color: "#1a6b52" },
      })
      rzp.open()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Payment error")
    } finally {
      setLoading(false)
    }
  }

  async function payStripe(amount: number, label: string | null) {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      toast.message("Please log in to donate")
      router.push(`/login?next=/projects/${projectId}`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/v1/payments/stripe/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          projectId,
          amount,
          microUnitLabel: label,
        }),
      })
      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error ?? "Could not start Stripe checkout")
      }
      if (!payload.url) {
        throw new Error("No checkout URL returned")
      }
      window.location.href = payload.url as string
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Payment error")
    } finally {
      setLoading(false)
    }
  }

  function onChooseAmount(amount: number, label: string | null) {
    if (!payments || (!payments.razorpay && !payments.stripe)) {
      toast.error("Payments are not configured yet.")
      return
    }
    if (payments.razorpay && payments.stripe) {
      setPending({ amount, label })
      setStep("method")
      return
    }
    if (payments.razorpay) {
      void payRazorpay(amount, label)
      return
    }
    void payStripe(amount, label)
  }

  const options =
    units?.length > 0
      ? units
      : [
          { amount: 50, label: "₹50 micro gift" },
          { amount: 200, label: "₹200 community support" },
          { amount: 1000, label: "₹1000 impact bundle" },
        ]

  const both = payments?.razorpay && payments?.stripe

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto">
          Donate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "method" && pending
              ? `Pay ₹${pending.amount} (choose provider)`
              : "Choose your impact"}
          </DialogTitle>
        </DialogHeader>

        {step === "amount" && (
          <>
            <div className="grid gap-3 py-2">
              {options.map((u) => (
                <Button
                  key={`${u.amount}-${u.label}`}
                  variant="outline"
                  className="h-auto flex-col items-start gap-1 py-3 text-left"
                  disabled={loading || payments === null}
                  onClick={() => onChooseAmount(u.amount, u.label)}
                >
                  <span className="font-semibold">₹{u.amount}</span>
                  <span className="text-xs font-normal text-muted-foreground">{u.label}</span>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {both
                ? "You can pay with Razorpay (UPI, cards, netbanking in India) or Stripe (cards and more)."
                : payments?.razorpay
                  ? "Secured by Razorpay: UPI, cards, and net banking at checkout."
                  : payments?.stripe
                    ? "You will be redirected to Stripe Checkout to complete payment."
                    : "Configure Razorpay and/or Stripe to accept donations."}
            </p>
          </>
        )}

        {step === "method" && pending && (
          <div className="grid gap-3 py-2">
            <Button type="button" variant="outline" disabled={loading} onClick={() => setStep("amount")}>
              ← Change amount
            </Button>
            <Button
              type="button"
              className="w-full"
              disabled={loading}
              onClick={() => void payRazorpay(pending.amount, pending.label)}
            >
              Pay with Razorpay
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={loading}
              onClick={() => void payStripe(pending.amount, pending.label)}
            >
              Pay with Stripe
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
