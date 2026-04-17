import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { sendWelcomeEmailFoster } from "@/lib/email/send"

export async function POST(request: Request) {
  try {
    const { userId, email, name } = await request.json()

    if (!userId || !email || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const origin = request.headers.get("origin") || "https://getsecondtail.com"
    const redirectTo = `${origin}/auth/callback`

    // Generate a confirmation link using the admin API
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      options: { redirectTo },
    })

    if (error) {
      console.error("[v0] Failed to generate confirmation link:", error.message)
      return NextResponse.json({ error: "Failed to generate confirmation link" }, { status: 400 })
    }

    const confirmationUrl = data?.properties?.action_link

    if (!confirmationUrl) {
      console.error("[v0] No action link returned from generateLink")
      return NextResponse.json({ error: "No confirmation URL generated" }, { status: 400 })
    }

    // Send branded welcome email with confirmation button
    const { success, error: emailError } = await sendWelcomeEmailFoster(email, name, undefined, confirmationUrl)

    if (!success) {
      console.error("[v0] Failed to send welcome email:", emailError)
      return NextResponse.json({ error: "Failed to send confirmation email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Confirmation email sent" })
  } catch (err) {
    console.error("[v0] create-foster-profile error:", err)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

