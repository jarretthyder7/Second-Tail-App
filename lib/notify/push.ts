// Web Push delivery. Server-only — imports node-only `web-push` and uses the
// Supabase service-role client so we can read/delete subscriptions across
// users (RLS on push_subscriptions intentionally blocks anon).
import webpush from "web-push"
import { createServiceRoleClient } from "@/lib/supabase/server"

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:noreply@getsecondtail.com"

let vapidConfigured = false
function ensureVapid(): boolean {
  if (vapidConfigured) return true
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn("[push] VAPID keys not configured — skipping push send")
    return false
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
  vapidConfigured = true
  return true
}

export type PushPayload = {
  title: string
  body: string
  // Deep link opened on click. Should be absolute or rooted ("/org/...").
  url: string
  // Optional dedupe tag — same tag replaces an earlier notification (e.g. all
  // messages from the same conversation collapse into one).
  tag?: string
}

export async function sendPush(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureVapid()) return

  const admin = createServiceRoleClient()
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId)

  if (error) {
    console.warn("[push] failed to load subscriptions:", error)
    return
  }
  if (!subs?.length) return

  const body = JSON.stringify(payload)

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        )
      } catch (err: any) {
        const status = err?.statusCode
        // 404 / 410 mean the push service has dropped the subscription — they
        // unsubscribed, uninstalled the PWA, or cleared site data. Prune so
        // we don't keep retrying dead endpoints.
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
        } else {
          console.warn(`[push] send failed for ${sub.endpoint} (${status}):`, err?.body || err?.message || err)
        }
      }
    }),
  )
}
