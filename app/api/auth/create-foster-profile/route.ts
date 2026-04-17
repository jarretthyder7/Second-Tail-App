import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { userId, email, name } = await request.json()

    if (!userId || !email || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Resend the signup confirmation email that Supabase already sent
    // This uses the configured email template in your Supabase project
    const { error: resendError } = await supabase.auth.resendEnvelope({
      type: "signup",
      email,
    })

    if (resendError) {
      console.log("[v0] Failed to resend confirmation email:", resendError)
      return NextResponse.json({ error: "Failed to resend email" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Confirmation email resent" })
  } catch (err) {
    console.log("[v0] create-foster-profile error:", err)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
