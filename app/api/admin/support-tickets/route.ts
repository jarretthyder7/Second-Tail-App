import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { orgId, subject, message, category } = await request.json()

  if (!orgId || !subject || !message || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    // Get organization and user profile info
    const { data: org } = await supabase.from("organizations").select("*").eq("id", orgId).single()

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Send email to admin
    const adminEmail = process.env.FROM_EMAIL || "Second Tail <onboarding@resend.dev>"
    const subject_line = `[Support Ticket] ${category} - ${org.name}`

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 24px; border: 1px solid #e5e7eb;">
          <h1 style="color: #d76b1a; margin-top: 0;">New Support Ticket</h1>
          
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 12px 0;"><strong style="color: #5a4a42;">Organization:</strong> ${org.name}</p>
            <p style="margin: 0 0 12px 0;"><strong style="color: #5a4a42;">Contact:</strong> ${profile?.full_name || user.email}</p>
            <p style="margin: 0 0 12px 0;"><strong style="color: #5a4a42;">Email:</strong> ${org.email}</p>
            <p style="margin: 0;"><strong style="color: #5a4a42;">Category:</strong> <span style="background-color: #d76b1a; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${category}</span></p>
          </div>

          <div style="background-color: #fef3c7; padding: 16px; border-left: 4px solid #d76b1a; border-radius: 4px; margin: 20px 0;">
            <h3 style="color: #5a4a42; margin-top: 0;">Issue:</h3>
            <p style="color: #2e2e2e; white-space: pre-wrap; word-wrap: break-word;">${message}</p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 20px; text-align: center;">
            Ticket submitted on ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: adminEmail,
        to: adminEmail,
        subject: subject_line,
        html: emailHtml,
      })
    } else {
      console.warn("[v0] RESEND_API_KEY not configured - support ticket not sent via email")
    }

    return NextResponse.json({
      success: true,
      message: "Support ticket submitted successfully. We'll be in touch soon!",
    })
  } catch (error) {
    console.error("[v0] Error submitting support ticket:", error)
    return NextResponse.json({ error: "Failed to submit support ticket" }, { status: 500 })
  }
}
