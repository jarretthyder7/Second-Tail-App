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
    // Try "signup" first for new users, fall back to "magiclink" for existing users
    let confirmationUrl: string | undefined

    const { data: signupData, error: signupError } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      options: { redirectTo },
    })

    if (!signupError && signupData?.properties?.action_link) {
      confirmationUrl = signupData.properties.action_link
    } else {
      // User already exists, try magiclink instead
      const { data: magicData, error: magicError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      })

      if (!magicError && magicData?.properties?.action_link) {
        confirmationUrl = magicData.properties.action_link
      }
    }

    if (!confirmationUrl) {
      return NextResponse.json({ error: "Failed to generate confirmation link" }, { status: 400 })
    }

    // Send branded welcome email with confirmation button
    const { success, error: emailError } = await sendWelcomeEmailFoster(email, name, undefined, confirmationUrl)

    if (!success) {
      return NextResponse.json({ error: "Failed to send confirmation email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Confirmation email sent" })
  } catch (err) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

