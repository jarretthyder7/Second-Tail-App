// Save a Web Push subscription for the authed user.
// Idempotent: re-subscribing on the same device just refreshes last_seen_at.
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    const sub = body?.subscription
    const endpoint: unknown = sub?.endpoint
    const p256dh: unknown = sub?.keys?.p256dh
    const auth: unknown = sub?.keys?.auth

    if (
      typeof endpoint !== "string" ||
      !endpoint.startsWith("https://") ||
      typeof p256dh !== "string" ||
      typeof auth !== "string"
    ) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }

    const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint,
        user_id: user.id,
        p256dh,
        auth,
        user_agent: userAgent,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    )

    if (error) {
      console.error("[/api/push/subscribe] upsert failed:", error)
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/push/subscribe] error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
