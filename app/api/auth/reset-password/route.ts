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
      // Don't reveal if user exists or not for security
      return NextResponse.json({ success: true, message: "If an account exists with this email, a reset link has been sent." })
    }

    const resetUrl = data?.properties?.action_link

    if (!resetUrl) {
      return NextResponse.json({ success: true, message: "If an account exists with this email, a reset link has been sent." })
    }

    // Send the branded password reset email
    const { success, error: emailError } = await sendPasswordResetEmail(email, resetUrl)

    if (!success) {
      return NextResponse.json({ error: "Failed to send password reset email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Password reset email sent" })
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
