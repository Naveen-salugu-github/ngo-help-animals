import { NextResponse } from "next/server"

/** Which payment backends are configured (no secrets exposed). */
export async function GET() {
  return NextResponse.json({
    razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    stripe: !!process.env.STRIPE_SECRET_KEY,
  })
}
