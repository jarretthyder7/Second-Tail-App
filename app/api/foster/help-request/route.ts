import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/send"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { orgId, message, type = "general", dogId, dogName } = body

    if (!orgId || !message) {
      return NextResponse.json({ error: "Organization ID and message required" }, { status: 400 })
    }

    // Get user profile to get organization email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, email, organization_id")
      .eq("id", user.id)
      .single()

    if (!profile || profile.organization_id !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get organization details for email
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, email")
      .eq("id", orgId)
      .single()

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Create help request in database
    const { data: helpRequest, error: createError } = await supabase
      .from("help_requests")
      .insert({
        organization_id: orgId,
        foster_id: user.id,
        dog_id: dogId || null,
        title: dogName ? `Help Request for ${dogName}` : "Help Request",
        description: message,
        category: type,
        status: "open",
        priority: type === "emergency" ? "high" : "medium",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error("[v0] Error creating help request:", createError)
      return NextResponse.json({ error: "Failed to create help request" }, { status: 500 })
    }

    // Create conversation message linking to the help request
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("organization_id", orgId)
      .eq("is_user_messaging_support", true)
      .eq("foster_id", user.id)
      .maybeSingle()

    let conversationId = conversation?.id

    // Create conversation if it doesn't exist
    if (!conversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          organization_id: orgId,
          foster_id: user.id,
          is_user_messaging_support: true,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (convError) {
        console.error("[v0] Error creating conversation:", convError)
      } else {
        conversationId = newConversation?.id
      }
    }

    // Create message in conversation if conversation exists
    if (conversationId) {
      const messageTitle = dogName ? `Help Request for ${dogName}` : "Help Request"
      await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: `**${messageTitle}**\n\n${message}\n\n---\n_Request submitted - our team will respond soon._`,
          created_at: new Date().toISOString(),
        })
    }

    // Send email to rescue organization
    if (org.email) {
      try {
        const emailSubject = dogName 
          ? `Help Request from ${profile.name} for ${dogName}` 
          : `Help Request from ${profile.name}`
        await sendEmail({
          to: org.email,
          subject: emailSubject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #D76B1A;">Help Request</h1>
              <p style="color: #666;">Foster parent <strong>${profile.name}</strong> (${profile.email}) has submitted a help request${dogName ? ` for <strong>${dogName}</strong>` : ""}.</p>
              
              <div style="background-color: #FBF8F4; padding: 20px; border-left: 4px solid #D76B1A; border-radius: 4px; margin: 20px 0;">
                <h3 style="color: #5A4A42; margin-top: 0;">Request Details</h3>
                <p style="color: #2E2E2E; white-space: pre-wrap;">${message}</p>
              </div>

              <p style="color: #666; margin: 20px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://app.secondtail.org"}/org/${orgId}/admin/request-supplies" style="background-color: #D76B1A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View in Admin Panel
                </a>
              </p>

              <p style="color: #999; font-size: 12px;">Request ID: ${helpRequest.id}</p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error("[v0] Error sending email:", emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      helpRequest,
      conversationId
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[v0] Help request API error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
