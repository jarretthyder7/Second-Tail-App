import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"
import { emailTemplates } from "@/lib/email/templates"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { appointmentId, notificationType, customMessage } = await request.json()

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(`
        *,
        dog:dogs(name, foster_id),
        assigned_to:profiles(name, email)
      `)
      .eq("id", appointmentId)
      .single()

    if (appointmentError || !appointment) {
      return Response.json({ error: "Appointment not found" }, { status: 404 })
    }

    const { data: foster } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", appointment.dog.foster_id)
      .single()

    if (!foster?.email) {
      return Response.json({ error: "Foster email not found" }, { status: 404 })
    }

    const appointmentDate = new Date(appointment.start_time).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const appointmentTime = new Date(appointment.start_time).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

    let emailData
    switch (notificationType) {
      case "reminder":
        emailData = emailTemplates.appointmentReminder(
          foster.name || "Foster",
          appointment.dog.name,
          appointment.title,
          appointmentDate,
          appointmentTime,
          appointment.location || "TBD",
          appointment.notes || customMessage,
        )
        break
      case "confirmation":
        emailData = emailTemplates.appointmentConfirmation(
          foster.name || "Foster",
          appointment.dog.name,
          appointment.title,
          appointmentDate,
          appointmentTime,
          appointment.location || "TBD",
          customMessage,
        )
        break
      case "update":
        emailData = emailTemplates.appointmentUpdate(
          foster.name || "Foster",
          appointment.dog.name,
          appointment.title,
          "Schedule Change",
          customMessage || "The appointment details have been updated. Please check your dashboard.",
        )
        break
      case "cancelled":
        emailData = emailTemplates.appointmentCancelled(
          foster.name || "Foster",
          appointment.dog.name,
          appointment.title,
          customMessage,
        )
        break
      default:
        return Response.json({ error: "Invalid notification type" }, { status: 400 })
    }

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: process.env.FROM_EMAIL || "Second Tail <onboarding@resend.dev>",
      to: foster.email,
      subject: emailData.subject,
      html: emailData.html,
    })

    if (emailError) {
      console.error("[v0] Error sending appointment email:", emailError)
      return Response.json({ error: "Failed to send email" }, { status: 500 })
    }

    await supabase.from("notifications").insert({
      user_id: appointment.dog.foster_id,
      type: "appointment",
      title: emailData.subject,
      message: `${appointment.title} - ${appointmentDate} at ${appointmentTime}`,
      link: `/foster/appointments`,
      read: false,
    })

    return Response.json({ success: true, emailId: emailResult?.id })
  } catch (error) {
    console.error("[v0] Error in appointment notification:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
