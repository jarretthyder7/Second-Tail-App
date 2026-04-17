// API endpoint for sending notification emails
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  sendEmail,
  sendWelcomeEmailFoster,
  sendWelcomeEmailRescue,
  sendAssignedToRescueEmail,
  sendAssignedDogEmail,
  sendAppointmentEmail,
  sendMessageNotificationToFoster,
  sendNewMessageEmailToOrg,
  sendAppointmentRequestEmail,
  sendMedicalUpdateEmail,
  sendSupplyRequestEmail,
  sendFosterInvitationEmail,
  sendFosterWaitlistEmail,
  sendRescueInviteFromFosterEmail,
} from "@/lib/email/send"

function escapeHtml(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await request.json()
    const { type, ...data } = body

    // Public endpoints — no auth required
    if (type === "foster-waitlist") {
      const result = await sendFosterWaitlistEmail(data.email, data.name)
      return result.success
        ? NextResponse.json({ success: true, emailId: result.emailId })
        : NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    // welcome-foster is sent at signup before the user is confirmed — no auth required
    if (type === "welcome-foster") {
      const result = await sendWelcomeEmailFoster(data.email, data.name, data.orgName, data.confirmationUrl)
      return result.success
        ? NextResponse.json({ success: true, emailId: result.emailId })
        : NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let result

    switch (type) {
      case "welcome-foster":
        result = await sendWelcomeEmailFoster(data.email, data.name, data.orgName)
        break
      case "welcome-rescue":
        result = await sendWelcomeEmailRescue(data.email, data.orgName, data.adminName)
        break
      case "assigned-rescue":
        result = await sendAssignedToRescueEmail(data.fosterEmail, data.fosterName, data.orgName)
        break
      case "assigned-dog":
        result = await sendAssignedDogEmail(data.fosterEmail, data.fosterName, data.dogName, data.breed)
        break
      case "appointment":
        result = await sendAppointmentEmail(
          data.fosterEmail,
          data.fosterName,
          data.dogName,
          data.appointmentTitle,
          data.appointmentTime,
        )
        break
      case "message-to-foster":
        // Rescue org sent a message to foster
        result = await sendMessageNotificationToFoster(data.fosterEmail, data.fosterName, data.orgName)
        break
      case "message-to-org":
        // Foster sent a message to rescue org
        result = await sendNewMessageEmailToOrg(data.orgEmail, data.orgName, data.fosterName, data.dogName)
        break
      case "appointment-request":
        // Foster requested an appointment
        result = await sendAppointmentRequestEmail(
          data.orgEmail,
          data.orgName,
          data.fosterName,
          data.dogName,
          data.appointmentType,
          data.preferredDate
        )
        break
      case "medical-update":
        result = await sendMedicalUpdateEmail(data.fosterEmail, data.fosterName, data.dogName, data.updateType)
        break
      case "foster-invitation":
        result = await sendFosterInvitationEmail(data.email, data.orgName, data.signUpUrl, data.hasAccount ?? false)
        break
      case "supply-request":
        result = await sendSupplyRequestEmail(data.rescueEmail, data.rescueName, data.fosterName, data.supplies)
        break
      case "rescue-invite-from-foster":
        result = await sendRescueInviteFromFosterEmail(
          data.rescueEmail,
          data.rescueName,
          data.fosterName,
          data.fosterCity,
          data.fosterState,
          data.customMessage
        )
        break
      case "org-paused":
        result = await sendEmail({
          to: data.email,
          subject: `${escapeHtml(data.orgName)} has been paused for ${escapeHtml(data.months)} month${escapeHtml(data.months) > 1 ? "s" : ""}`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #f59e0b;">Organization Paused</h1>
            <p>Your rescue organization <strong>${escapeHtml(data.orgName)}</strong> has been temporarily paused.</p>
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Paused by:</strong> ${escapeHtml(data.pausedBy)}</p>
              <p><strong>Duration:</strong> ${escapeHtml(data.months)} month${escapeHtml(data.months) > 1 ? "s" : ""}</p>
              <p><strong>Pause until:</strong> ${escapeHtml(data.pausedUntil)}</p>
            </div>
            <p>During this time, foster activities will be limited.</p>
          </div>`,
        })
        break
      case "org-closed":
        result = await sendEmail({
          to: data.email,
          subject: `${escapeHtml(data.orgName)} organization has been closed`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626;">Organization Closed</h1>
            <p>Your rescue organization <strong>${escapeHtml(data.orgName)}</strong> has been permanently closed.</p>
            <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Closed by:</strong> ${escapeHtml(data.closedBy)}</p>
              <p><strong>Closure date:</strong> ${new Date().toDateString()}</p>
            </div>
            <p>If you wish to reopen, please contact Second Tail support.</p>
          </div>`,
        })
        break
      case "appointment-cancelled":
        result = await sendAppointmentEmail(
          data.fosterEmail,
          data.fosterName,
          data.dogName,
          `CANCELLED: ${data.appointmentTitle}`,
          data.appointmentTime
        )
        break
      default:
        return NextResponse.json({ error: "Unknown email type" }, { status: 400 })
    }

    if (result.success) {
      return NextResponse.json({ success: true, emailId: result.emailId })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Email API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
