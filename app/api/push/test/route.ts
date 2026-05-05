// Diagnostic endpoint — fires a push notification to the authed user. Used
// from the settings toggle's "Send test push" button to isolate the push
// pipeline (subscribe → web-push → SW) from the message pipeline.
//
// Returns a structured response describing what was attempted so the client
// can show a useful error if nothing arrives.
import { type NextRequest, NextResponse } from "next/server"
import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { sendPush } from "@/lib/notify/push"

export const runtime = "nodejs"

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Read subscriptions via service role so we can report exactly what
    // we'd attempt to send to (RLS would also allow this for own user, but
    // matching sendPush's data path is more useful for debugging).
    const admin = createServiceRoleClient()
    const { data: subs, error: subsError } = await admin
      .from("push_subscriptions")
      .select("endpoint, user_agent, created_at")
      .eq("user_id", user.id)

    if (subsError) {
      return NextResponse.json(
        { ok: false, stage: "load-subs", error: subsError.message },
        { status: 500 },
      )
    }

    const subscriptionCount = subs?.length || 0

    if (subscriptionCount === 0) {
      return NextResponse.json({
        ok: false,
        stage: "no-subscriptions",
        message:
          "No push subscriptions saved for this user. Toggle push off and back on, and check the browser console for errors.",
      })
    }

    await sendPush(user.id, {
      title: "Second Tail test push",
      body: "If you see this, push notifications are working end-to-end.",
      url: "/",
      tag: "test-push",
    })

    return NextResponse.json({
      ok: true,
      subscriptionCount,
      subscriptions: subs?.map((s) => ({
        endpointHost: safeHost(s.endpoint),
        userAgent: s.user_agent,
        createdAt: s.created_at,
      })),
    })
  } catch (err) {
    console.error("[/api/push/test] error:", err)
    return NextResponse.json(
      { ok: false, stage: "exception", error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

function safeHost(endpoint: string): string {
  try {
    return new URL(endpoint).host
  } catch {
    return "unknown"
  }
}
