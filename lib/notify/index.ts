// Central notification dispatcher. Server-only.
//
// All notification logic flows through notify(): preference checks, recipient
// lookup, channel fan-out (email today, push later). Callers describe the
// event; they never construct emails or talk to Resend directly.
import type { SupabaseClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email/send"
import { emailTemplates } from "@/lib/email/templates"
import { shouldSendEmailNotification } from "@/lib/messaging/should-notify"
import { sendPush, type PushPayload } from "./push"
import { diffDog, plainChangeList, renderChangeSummary, type DogChange } from "./dog-diff"

export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://getsecondtail.com").replace(/\/$/, "")

export type NotifyEvent =
  | {
      type: "message.new"
      conversationId: string
      // The user who sent the message; we never notify them.
      senderId: string
    }
  | {
      type: "dog.profile_updated"
      dogId: string
      before: Record<string, unknown>
      after: Record<string, unknown>
      // The user who made the update; if they're the assigned foster
      // (rare but possible), suppress the email.
      actorId: string
    }

// Per-recipient dispatch. Email and push are both optional, but in practice
// one of them is set — preference + debounce checks are applied earlier when
// constructing the dispatch, so anything reaching this struct is something
// we want to send.
type Dispatch = {
  recipientId: string
  email?: { to: string; subject: string; html: string }
  push?: PushPayload
}

export async function notify(supabase: SupabaseClient, event: NotifyEvent): Promise<void> {
  const dispatches = await buildDispatches(supabase, event)
  // Best-effort fan-out: a failure for one recipient or one channel doesn't
  // block the others, and doesn't bubble up (the underlying mutation has
  // already succeeded).
  await Promise.all(
    dispatches.map(async (d) => {
      const tasks: Promise<unknown>[] = []
      if (d.email) {
        tasks.push(
          sendEmail(d.email).catch((err) =>
            console.warn(`[notify] email failed for ${d.recipientId}:`, err),
          ),
        )
      }
      if (d.push) {
        tasks.push(
          sendPush(d.recipientId, d.push).catch((err) =>
            console.warn(`[notify] push failed for ${d.recipientId}:`, err),
          ),
        )
      }
      await Promise.all(tasks)
    }),
  )
}

async function buildDispatches(supabase: SupabaseClient, event: NotifyEvent): Promise<Dispatch[]> {
  switch (event.type) {
    case "message.new":
      return buildMessageDispatches(supabase, event)
    case "dog.profile_updated":
      return buildDogUpdateDispatches(supabase, event)
  }
}

// ── message.new ─────────────────────────────────────────────────────────────

async function buildMessageDispatches(
  supabase: SupabaseClient,
  event: Extract<NotifyEvent, { type: "message.new" }>,
): Promise<Dispatch[]> {
  const { conversationId, senderId } = event

  const { data: conversation } = await supabase
    .from("conversations")
    .select(
      "id, organization_id, recipient_id, dog:dogs(id, name), organization:organizations(id, name, notification_preferences)",
    )
    .eq("id", conversationId)
    .maybeSingle()

  if (!conversation) return []

  const { data: sender } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("id", senderId)
    .maybeSingle()

  if (!sender) return []

  const orgId = conversation.organization_id as string
  const orgName = (conversation.organization as any)?.name || "your rescue"
  const dogName = (conversation.dog as any)?.name || "their foster"

  if (sender.role === "rescue") {
    // Admin → foster. The foster is the conversation recipient.
    const recipientId = conversation.recipient_id as string | null
    if (!recipientId) return []

    const { data: foster } = await supabase
      .from("profiles")
      .select("id, name, email, notification_preferences")
      .eq("id", recipientId)
      .maybeSingle()

    if (!foster) return []
    if (!fosterPrefAllows(foster, "email_messages")) return []
    if (!(await shouldSendEmailNotification(supabase, conversationId, foster.id))) return []

    const link = `${APP_URL}/org/${orgId}/foster/messages/${conversationId}`
    const dispatch: Dispatch = {
      recipientId: foster.id,
      push: {
        title: `New message from ${orgName}`,
        body: `${sender.name || "Your rescue"} sent you a message`,
        url: link,
        // One banner per conversation — newer messages replace older ones.
        tag: `conversation:${conversationId}`,
      },
    }
    if (foster.email) {
      const tpl = emailTemplates.messageNotificationToFoster(foster.name || "there", orgName, link)
      dispatch.email = { to: foster.email, subject: tpl.subject, html: tpl.html }
    }
    return [dispatch]
  }

  // Foster → admins. Notify all org admins (minus the sender if they happen
  // to be one) whose org prefs allow it and who aren't actively reading.
  if (!orgPrefAllows(conversation.organization, "new_message_from_foster")) return []

  const { data: admins } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("organization_id", orgId)
    .eq("role", "rescue")
    .eq("org_role", "org_admin")

  if (!admins?.length) return []

  const link = `${APP_URL}/org/${orgId}/admin/messages/${conversationId}`
  const fosterName = sender.name || "A foster"

  const dispatches: Dispatch[] = []
  for (const admin of admins) {
    if (admin.id === senderId) continue
    if (!(await shouldSendEmailNotification(supabase, conversationId, admin.id))) continue
    const dispatch: Dispatch = {
      recipientId: admin.id,
      push: {
        title: `New message from ${fosterName}`,
        body: `Re: ${dogName}`,
        url: link,
        tag: `conversation:${conversationId}`,
      },
    }
    if (admin.email) {
      const tpl = emailTemplates.newMessageToOrg(orgName, fosterName, dogName, link)
      dispatch.email = { to: admin.email, subject: tpl.subject, html: tpl.html }
    }
    dispatches.push(dispatch)
  }
  return dispatches
}

// ── dog.profile_updated ─────────────────────────────────────────────────────

async function buildDogUpdateDispatches(
  supabase: SupabaseClient,
  event: Extract<NotifyEvent, { type: "dog.profile_updated" }>,
): Promise<Dispatch[]> {
  const changes: DogChange[] = diffDog(event.before, event.after)
  if (changes.length === 0) return []

  const fosterId = (event.after.foster_id ?? event.before.foster_id) as string | null | undefined
  if (!fosterId) return []
  if (fosterId === event.actorId) return []

  const orgId = (event.after.organization_id ?? event.before.organization_id) as string | null | undefined
  if (!orgId) return []

  const [{ data: foster }, { data: org }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, notification_preferences")
      .eq("id", fosterId)
      .maybeSingle(),
    supabase.from("organizations").select("id, name").eq("id", orgId).maybeSingle(),
  ])

  if (!foster) return []
  if (!fosterPrefAllows(foster, "email_updates")) return []

  const dogName = (event.after.name as string) || (event.before.name as string) || "your foster"
  const orgName = org?.name || "your rescue"
  const link = `${APP_URL}/org/${orgId}/foster/dog/${event.dogId}`
  const changeList = plainChangeList(changes)

  const dispatch: Dispatch = {
    recipientId: foster.id,
    push: {
      title: `${dogName}'s profile was updated`,
      body: `${orgName} updated: ${changeList}`,
      url: link,
      // Collapse multiple edits to the same dog into a single banner.
      tag: `dog:${event.dogId}`,
    },
  }
  if (foster.email) {
    const tpl = emailTemplates.dogProfileUpdated({
      fosterName: foster.name || "there",
      dogName,
      orgName,
      changeSummaryHtml: renderChangeSummary(changes),
      changeListPlain: changeList,
      link,
    })
    dispatch.email = { to: foster.email, subject: tpl.subject, html: tpl.html }
  }
  return [dispatch]
}

// ── preference helpers ──────────────────────────────────────────────────────

// Defaults to true: a foster who has never opened settings still gets emails.
function fosterPrefAllows(profile: any, key: "email_messages" | "email_updates" | "email_reminders"): boolean {
  const prefs = profile?.notification_preferences
  if (!prefs || typeof prefs !== "object") return true
  return prefs[key] !== false
}

function orgPrefAllows(
  org: any,
  key: "new_message_from_foster" | "foster_appointment_request" | "foster_supply_request" | "foster_reimbursement_request",
): boolean {
  const prefs = org?.notification_preferences
  if (!prefs || typeof prefs !== "object") return true
  return prefs[key] !== false
}
