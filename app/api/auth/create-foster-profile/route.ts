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

    // Generate confirmation link using admin API
    const origin = request.headers.get("origin") || "https://getsecondtail.com"
    const redirectTo = `${origin}/auth/callback`

    let confirmationUrl: string | undefined

    try {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "signup",
        email,
        options: { redirectTo },
      })

      if (!linkError && linkData?.properties?.action_link) {
        confirmationUrl = linkData.properties.action_link
      }
    } catch (err) {
      console.log("[v0] Failed to generate confirmation link:", err)
      // Continue without confirmation URL - email will still send
    }

    // Send branded welcome email with confirmation CTA
    try {
      await sendWelcomeEmailFoster(email, name, undefined, confirmationUrl)
    } catch (emailErr) {
      console.log("[v0] Failed to send welcome email:", emailErr)
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.log("[v0] create-foster-profile error:", err)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
