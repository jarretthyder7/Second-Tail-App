// Remove a push subscription. Called when the client unsubscribes
// (settings toggle, sign-out flow). Push-service 410s are cleaned up
// server-side, so the client doesn't have to call this for those.
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
    const endpoint: unknown = body?.endpoint

    if (typeof endpoint !== "string") {
      return NextResponse.json({ error: "endpoint required" }, { status: 400 })
    }

    // RLS scopes deletes to the authed user, so a malicious caller can't
    // delete someone else's subscription even with a known endpoint.
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/push/unsubscribe] error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
