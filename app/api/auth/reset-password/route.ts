import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { sendPasswordResetEmail } from "@/lib/email/send"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const origin = request.headers.get("origin") || "https://getsecondtail.com"

    // Generate a password reset link using the admin API
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      },
    })

    if (error) {
      console.error("[v0] Failed to generate password reset link:", error.message)
      // Don't reveal if user exists or not for security
      return NextResponse.json({ success: true, message: "If an account exists with this email, a reset link has been sent." })
    }

    const resetUrl = data?.properties?.action_link

    if (!resetUrl) {
      console.error("[v0] No reset link returned from generateLink")
      return NextResponse.json({ success: true, message: "If an account exists with this email, a reset link has been sent." })
    }

    // Send the branded password reset email
    const { success, error: emailError } = await sendPasswordResetEmail(email, resetUrl)

    if (!success) {
      console.error("[v0] Failed to send password reset email:", emailError)
      return NextResponse.json({ error: "Failed to send password reset email" }, { status: 500 })
    }

    console.log("[v0] Password reset email sent successfully to:", email)
    return NextResponse.json({ success: true, message: "Password reset email sent" })
  } catch (err) {
    console.error("[v0] reset-password error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
