// Email sending utility using Resend
import { emailTemplates } from "./templates"

const RESEND_API_KEY = process.env.RESEND_API_KEY
// Use Resend's default testing domain if no verified domain is configured
const FROM_EMAIL = process.env.FROM_EMAIL || "Second Tail <onboarding@resend.dev>"

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(options: EmailOptions) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured. Emails will not be sent.")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Error sending email:", error)
      return { success: false, error: error.message }
    }

    const data = await response.json()
    console.log("Email sent successfully:", data.id)
    return { success: true, emailId: data.id }
  } catch (error) {
    console.error("Failed to send email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Specific email sending functions
export async function sendWelcomeEmailFoster(email: string, name: string, orgName?: string, confirmationUrl?: string) {
  const template = emailTemplates.welcomeFoster(name, orgName, confirmationUrl)
  return sendEmail({ to: email, ...template })
}

export async function sendWelcomeEmailRescue(email: string, orgName: string, adminName: string) {
  const template = emailTemplates.welcomeRescue(orgName, adminName)
  return sendEmail({ to: email, ...template })
}

export async function sendAssignedToRescueEmail(fosterEmail: string, fosterName: string, orgName: string) {
  const template = emailTemplates.assignedToRescue(fosterName, orgName)
  return sendEmail({ to: fosterEmail, ...template })
}

export async function sendAssignedDogEmail(fosterEmail: string, fosterName: string, dogName: string, breed: string) {
  const template = emailTemplates.assignedDog(fosterName, dogName, breed)
  return sendEmail({ to: fosterEmail, ...template })
}

export async function sendAppointmentEmail(
  fosterEmail: string,
  fosterName: string,
  dogName: string,
  appointmentTitle: string,
  appointmentTime: string,
) {
  const template = emailTemplates.appointment(fosterName, dogName, appointmentTitle, appointmentTime)
  return sendEmail({ to: fosterEmail, ...template })
}

// Notify foster when the rescue org sends them a message
export async function sendMessageNotificationToFoster(fosterEmail: string, fosterName: string, orgName: string) {
  const template = emailTemplates.messageNotificationToFoster(fosterName, orgName)
  return sendEmail({ to: fosterEmail, ...template })
}

// Notify rescue org when a foster sends them a message
export async function sendNewMessageEmailToOrg(orgEmail: string, orgName: string, fosterName: string, dogName: string) {
  const template = emailTemplates.newMessageToOrg(orgName, fosterName, dogName)
  return sendEmail({ to: orgEmail, ...template })
}

// Notify rescue org when a foster requests an appointment
export async function sendAppointmentRequestEmail(
  orgEmail: string,
  orgName: string,
  fosterName: string,
  dogName: string,
  appointmentType: string,
  preferredDate: string
) {
  const template = emailTemplates.appointmentRequest(orgName, fosterName, dogName, appointmentType, preferredDate)
  return sendEmail({ to: orgEmail, ...template })
}

export async function sendMedicalUpdateEmail(
  fosterEmail: string,
  fosterName: string,
  dogName: string,
  updateType: string,
) {
  const template = emailTemplates.medicalUpdate(fosterName, dogName, updateType)
  return sendEmail({ to: fosterEmail, ...template })
}

export async function sendFosterInvitationEmail(
  email: string,
  orgName: string,
  signUpUrl: string,
  hasAccount: boolean,
) {
  const template = emailTemplates.fosterInvitation(orgName, signUpUrl, hasAccount)
  return sendEmail({ to: email, ...template })
}

export async function sendSupplyRequestEmail(
  rescueEmail: string,
  rescueName: string,
  fosterName: string,
  supplies: string,
  animalName?: string,
  orgId?: string,
) {
  const template = emailTemplates.supplyRequest(rescueName, fosterName, supplies, animalName, orgId)
  return sendEmail({ to: rescueEmail, ...template })
}

// Send confirmation email to foster when admin schedules their appointment request
export async function sendAppointmentConfirmedEmail(
  fosterEmail: string,
  fosterName: string,
  appointmentType: string,
  confirmedDate: string,
  confirmedTime: string,
  notes: string,
  orgName: string,
) {
  const template = emailTemplates.appointmentConfirmed(
    fosterName,
    appointmentType,
    confirmedDate,
    confirmedTime,
    notes,
    orgName,
  )
  return sendEmail({ to: fosterEmail, ...template })
}

// Send decline notification to foster when admin declines their appointment request
export async function sendAppointmentDeclinedEmail(
  fosterEmail: string,
  fosterName: string,
  appointmentType: string,
  requestedDate: string,
  orgName: string,
) {
  const template = emailTemplates.appointmentDeclined(fosterName, appointmentType, requestedDate, orgName)
  return sendEmail({ to: fosterEmail, ...template })
}

export async function sendFosterWaitlistEmail(email: string, name: string) {
  const template = emailTemplates.fosterWaitlist(name)
  return sendEmail({ to: email, ...template })
}

export async function sendRescueInviteFromFosterEmail(
  rescueEmail: string,
  rescueName: string,
  fosterName: string,
  fosterCity: string,
  fosterState: string,
  customMessage?: string,
) {
  const template = emailTemplates.rescueInviteFromFoster(fosterName, fosterCity, fosterState, customMessage)
  return sendEmail({ to: rescueEmail, ...template })
}

// Send appointment request confirmation to foster
export async function sendAppointmentRequestConfirmationEmail(
  fosterEmail: string,
  fosterName: string,
  appointmentType: string,
  preferredDate: string,
  preferredTime: string,
  reason: string,
) {
  const template = emailTemplates.appointmentRequestConfirmation(
    fosterName,
    appointmentType,
    preferredDate,
    preferredTime,
    reason,
  )
  return sendEmail({ to: fosterEmail, ...template })
}
