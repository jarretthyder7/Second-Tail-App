// API endpoint for sending notification emails
import { type NextRequest, NextResponse } from "next/server"
import {
  sendWelcomeEmailFoster,
  sendWelcomeEmailRescue,
  sendAssignedToRescueEmail,
  sendAssignedDogEmail,
  sendAppointmentEmail,
  sendNewMessageEmail,
  sendMedicalUpdateEmail,
  sendSupplyRequestEmail,
  sendFosterInvitationEmail,
} from "@/lib/email/send"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...data } = body

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
      case "message":
        result = await sendNewMessageEmail(data.fosterEmail, data.fosterName, data.senderName)
        break
      case "medical-update":
        result = await sendMedicalUpdateEmail(data.fosterEmail, data.fosterName, data.dogName, data.updateType)
        break
      case "foster-invitation":
        result = await sendFosterInvitationEmail(data.email, data.orgName, data.inviteCode, data.signUpUrl)
        break
      case "supply-request":
        result = await sendSupplyRequestEmail(data.rescueEmail, data.rescueName, data.fosterName, data.supplies)
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
