// Centralized notification trigger.
//
// Clients POST a small event payload (just IDs); the server resolves
// recipients, checks preferences, and fans out to email (and later push).
// Replaces ad-hoc /api/email/send calls scattered across client code.
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { notify } from "@/lib/notify"

// notify() pulls in web-push, which depends on node:crypto.
export const runtime = "nodejs"

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
    const { event } = body || {}

    if (!event || typeof event !== "object" || typeof event.type !== "string") {
      return NextResponse.json({ error: "Missing event" }, { status: 400 })
    }

    if (event.type === "message.new") {
      if (typeof event.conversationId !== "string") {
        return NextResponse.json({ error: "conversationId required" }, { status: 400 })
      }
      // The sender is always the authed user — clients can't spoof it.
      await notify(supabase, {
        type: "message.new",
        conversationId: event.conversationId,
        senderId: user.id,
      })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Unknown event type" }, { status: 400 })
  } catch (error) {
    console.error("[/api/notify] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
