// Centralized notification trigger for client-driven events.
//
// Clients POST { event: <NotifyEvent> }. The server resolves recipients,
// checks per-user prefs, and fans out to email + push. Replaces ad-hoc
// /api/email/send calls scattered across client code.
//
// Events triggered server-side (e.g. dogs PATCH, supply-request submit)
// import notify() directly and don't go through this endpoint.
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { notify, type NotifyEvent } from "@/lib/notify"

// notify() pulls in web-push, which depends on node:crypto.
export const runtime = "nodejs"

// Event types clients are allowed to fire from this endpoint. Server-only
// events (dog.profile_updated for instance) aren't here because they'd never
// be fired from the client.
const CLIENT_EVENT_TYPES = [
  "message.new",
  "foster.appointment_confirmed",
  "foster.appointment_declined",
  "foster.appointment_cancelled",
  "foster.supply_acknowledged",
  "foster.reimbursement_approved",
  "foster.reimbursement_rejected",
  "foster.reimbursement_paid",
  "admin.appointment_request",
  "admin.supply_request",
  "admin.reimbursement_submitted",
  "admin.foster_log_submitted",
] as const

type ClientEventType = (typeof CLIENT_EVENT_TYPES)[number]

function isClientEventType(t: unknown): t is ClientEventType {
  return typeof t === "string" && (CLIENT_EVENT_TYPES as readonly string[]).includes(t)
}

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
    const eventInput = body?.event

    if (!eventInput || typeof eventInput !== "object" || !isClientEventType(eventInput.type)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 })
    }

    // For message events the sender is always the authed user — clients
    // can't spoof it. Other events trust the body fields but the recipient
    // resolution + prefs check happen inside notify(), so a malicious caller
    // can at worst trigger an extra email to a user already entitled to
    // receive that kind of notification.
    let event: NotifyEvent
    if (eventInput.type === "message.new") {
      if (typeof eventInput.conversationId !== "string") {
        return NextResponse.json({ error: "conversationId required" }, { status: 400 })
      }
      event = {
        type: "message.new",
        conversationId: eventInput.conversationId,
        senderId: user.id,
      }
    } else {
      event = eventInput as NotifyEvent
    }

    await notify(supabase, event)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[/api/notify] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
