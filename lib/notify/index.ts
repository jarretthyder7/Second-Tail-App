// Central notification dispatcher. Server-only.
//
// Every notification flows through notify(): preference checks, recipient
// lookup, channel fan-out (email + push). Callers describe the event;
// they never construct emails or talk to Resend directly.
//
// Per-user prefs live on profiles.notification_preferences as a JSONB
// object of pref-key → boolean. Push always fires regardless of prefs
// (per product call); only email is gated by prefs. Missing keys default
// to true so a user who's never opened settings still gets every email.
//
// Some events (welcome, password reset, account invitations, dog-assigned)
// always send and are not surfaced as toggles — they're informational
// surfaces too important to silently drop.
import type { SupabaseClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email/send"
import { emailTemplates } from "@/lib/email/templates"
import { shouldSendEmailNotification } from "@/lib/messaging/should-notify"
import { sendPush, type PushPayload } from "./push"
import { diffDog, plainChangeList, renderChangeSummary, type DogChange } from "./dog-diff"

export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://getsecondtail.com").replace(/\/$/, "")

// ── Pref keys ───────────────────────────────────────────────────────────────
//
// Single per-user pref bag. A foster only ever sees the foster keys in
// settings; an admin only sees the admin keys. The shared "messages" key
// works for both because each user is exactly one role.
export type NotificationPrefKey =
  // Foster keys
  | "messages"
  | "dog_updates"
  | "appointments"
  | "supplies"
  | "reimbursements"
  // Admin keys
  | "appointment_requests"
  | "supply_requests"
  | "reimbursement_requests"
  | "foster_log_updates"

// ── Event types ─────────────────────────────────────────────────────────────

export type NotifyEvent =
  // Multi-recipient (depends on sender role)
  | {
      type: "message.new"
      conversationId: string
      senderId: string
    }
  // Foster recipient
  | {
      type: "dog.profile_updated"
      dogId: string
      before: Record<string, unknown>
      after: Record<string, unknown>
      actorId: string
    }
  | { type: "foster.appointment_confirmed"; fosterId: string; orgId: string; appointmentType: string; confirmedDate: string; confirmedTime: string; notes: string; orgName?: string }
  | { type: "foster.appointment_declined"; fosterId: string; orgId: string; appointmentType: string; requestedDate: string; orgName?: string }
  | { type: "foster.appointment_cancelled"; fosterId: string; orgId: string; dogName: string; appointmentTitle: string; appointmentTime: string }
  | { type: "foster.supply_acknowledged"; fosterId: string; orgId: string; rescueName: string; requestTitle: string; pickupTime: string; pickupLocation: string; pickupNotes: string | null; isUpdate?: boolean }
  | { type: "foster.reimbursement_approved"; fosterId: string; amount: string; category: string; notes?: string }
  | { type: "foster.reimbursement_rejected"; fosterId: string; amount: string; category: string; notes?: string }
  | { type: "foster.reimbursement_paid"; fosterId: string; amount: string; category: string; paymentDate: string; paymentMethod?: string }
  // Admin recipients (fans out to all org admins)
  | { type: "admin.appointment_request"; orgId: string; fosterId: string; dogId: string; appointmentType: string; preferredDate: string }
  | { type: "admin.supply_request"; orgId: string; fosterId: string; dogId?: string; supplies: string }
  | { type: "admin.reimbursement_submitted"; orgId: string; fosterId: string; amount: string; category: string; description: string }
  | { type: "admin.foster_log_submitted"; orgId: string; fosterId: string; dogId: string; category: "general" | "behavior" | "health"; mood: "rough" | "ok" | "great"; notes: string }

// Per-recipient dispatch. Email and push are both optional — pref + debounce
// checks are applied earlier when constructing the dispatch, so anything
// reaching this struct is something we want to send.
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
    case "foster.appointment_confirmed":
      return buildFosterAppointmentConfirmed(supabase, event)
    case "foster.appointment_declined":
      return buildFosterAppointmentDeclined(supabase, event)
    case "foster.appointment_cancelled":
      return buildFosterAppointmentCancelled(supabase, event)
    case "foster.supply_acknowledged":
      return buildFosterSupplyAcknowledged(supabase, event)
    case "foster.reimbursement_approved":
      return buildFosterReimbursementApproved(supabase, event)
    case "foster.reimbursement_rejected":
      return buildFosterReimbursementRejected(supabase, event)
    case "foster.reimbursement_paid":
      return buildFosterReimbursementPaid(supabase, event)
    case "admin.appointment_request":
      return buildAdminAppointmentRequest(supabase, event)
    case "admin.supply_request":
      return buildAdminSupplyRequest(supabase, event)
    case "admin.reimbursement_submitted":
      return buildAdminReimbursementSubmitted(supabase, event)
    case "admin.foster_log_submitted":
      return buildAdminFosterLogSubmitted(supabase, event)
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
      // dog.foster_id is the FOSTER user. conversations.recipient_id is the
      // primary RESCUE staff member on this thread (legacy naming from when
      // a conversation had a single rescue contact). Don't confuse the two.
      "id, organization_id, dog:dogs(id, name, foster_id), organization:organizations(id, name)",
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
  const dog = conversation.dog as any
  const dogName = dog?.name || "their foster"
  const fosterUserId = dog?.foster_id as string | null | undefined

  if (sender.role === "rescue") {
    // Admin → foster.
    if (!fosterUserId) return []
    if (!(await shouldSendEmailNotification(supabase, conversationId, fosterUserId))) return []

    const foster = await loadProfile(supabase, fosterUserId)
    if (!foster) return []

    const link = `${APP_URL}/org/${orgId}/foster/messages/${conversationId}`
    const dispatch: Dispatch = {
      recipientId: foster.id,
      push: {
        title: `New message from ${orgName}`,
        body: `${sender.name || "Your rescue"} sent you a message`,
        url: link,
        tag: `conversation:${conversationId}`,
      },
    }
    if (foster.email && prefAllows(foster, "messages")) {
      const tpl = emailTemplates.messageNotificationToFoster(foster.name || "there", orgName, link)
      dispatch.email = { to: foster.email, subject: tpl.subject, html: tpl.html }
    }
    return [dispatch]
  }

  // Foster → admins. Notify all org admins (minus the sender if they happen
  // to be one) whose prefs allow it and who aren't actively reading.
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, name, email, notification_preferences")
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
    if (admin.email && prefAllows(admin, "messages")) {
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

  const [foster, org] = await Promise.all([
    loadProfile(supabase, fosterId),
    loadOrgName(supabase, orgId),
  ])
  if (!foster) return []

  const dogName = (event.after.name as string) || (event.before.name as string) || "your foster"
  const orgName = org || "your rescue"
  const link = `${APP_URL}/org/${orgId}/foster/dog/${event.dogId}`
  const changeList = plainChangeList(changes)

  const dispatch: Dispatch = {
    recipientId: foster.id,
    push: {
      title: `${dogName}'s profile was updated`,
      body: `${orgName} updated: ${changeList}`,
      url: link,
      tag: `dog:${event.dogId}`,
    },
  }
  if (foster.email && prefAllows(foster, "dog_updates")) {
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

// ── foster appointments ─────────────────────────────────────────────────────

async function buildFosterAppointmentConfirmed(
  supabase: SupabaseClient,
  e: Extract<NotifyEvent, { type: "foster.appointment_confirmed" }>,
): Promise<Dispatch[]> {
  const foster = await loadProfile(supabase, e.fosterId)
  if (!foster) return []
  const orgName = e.orgName || (await loadOrgName(supabase, e.orgId)) || "your rescue"
  const link = `${APP_URL}/org/${e.orgId}/foster/appointments`

  const dispatch: Dispatch = {
    recipientId: foster.id,
    push: {
      title: `Appointment confirmed`,
      body: `${e.appointmentType} on ${e.confirmedDate} at ${e.confirmedTime}`,
      url: link,
      tag: `appointment:${e.fosterId}`,
    },
  }
  if (foster.email && prefAllows(foster, "appointments")) {
    const tpl = emailTemplates.appointmentConfirmed(foster.name || "there", e.appointmentType, e.confirmedDate, e.confirmedTime, e.notes, orgName)
    dispatch.email = { to: foster.email, subject: tpl.subject, html: tpl.html }
  }
  return [dispatch]
}

async function buildFosterAppointmentDeclined(
  supabase: SupabaseClient,
  e: Extract<NotifyEvent, { type: "foster.appointment_declined" }>,
): Promise<Dispatch[]> {
  const foster = await loadProfile(supabase, e.fosterId)
  if (!foster) return []
  const orgName = e.orgName || (await loadOrgName(supabase, e.orgId)) || "your rescue"
  const link = `${APP_URL}/org/${e.orgId}/foster/appointments`

  const dispatch: Dispatch = {
    recipientId: foster.id,
    push: {
      title: `Appointment request declined`,
      body: `${e.appointmentType} on ${e.requestedDate}`,
      url: link,
    },
  }
  if (foster.email && prefAllows(foster, "appointments")) {
    const tpl = emailTemplates.appointmentDeclined(foster.name || "there", e.appointmentType, e.requestedDate, orgName)
    dispatch.email = { to: foster.email, subject: tpl.subject, html: tpl.html }
  }
  return [dispatch]
}

async function buildFosterAppointmentCancelled(
  supabase: SupabaseClient,
  e: Extract<NotifyEvent, { type: "foster.appointment_cancelled" }>,
): Promise<Dispatch[]> {
  const foster = await loadProfile(supabase, e.fosterId)
  if (!foster) return []
  const link = `${APP_URL}/org/${e.orgId}/foster/appointments`

  const dispatch: Dispatch = {
    recipientId: foster.id,
    push: {
      title: `Appointment cancelled`,
      body: `${e.appointmentTitle} for ${e.dogName}`,
      url: link,
    },
  }
  if (foster.email && prefAllows(foster, "appointments")) {
    const tpl = emailTemplates.appointment(foster.name || "there", e.dogName, `CANCELLED: ${e.appointmentTitle}`, e.appointmentTime)
    dispatch.email = { to: foster.email, subject: tpl.subject, html: tpl.html }
  }
  return [dispatch]
}

// ── foster supplies ─────────────────────────────────────────────────────────

async function buildFosterSupplyAcknowledged(
  supabase: SupabaseClient,
  e: Extract<NotifyEvent, { type: "foster.supply_acknowledged" }>,
): Promise<Dispatch[]> {
  const foster = await loadProfile(supabase, e.fosterId)
  if (!foster) return []
  const link = `${APP_URL}/org/${e.orgId}/foster/request-supplies`

  const dispatch: Dispatch = {
    recipientId: foster.id,
    push: {
      title: e.isUpdate ? "Supply pickup updated" : "Supply request ready",
      body: `${e.requestTitle} — ${e.pickupTime}`,
      url: link,
    },
  }
  if (foster.email && prefAllows(foster, "supplies")) {
    const tpl = emailTemplates.supplyAcknowledged(
      foster.name || "there",
      e.rescueName,
      e.requestTitle,
      e.pickupTime,
      e.pickupLocation,
      e.pickupNotes,
      e.orgId,
      e.isUpdate ?? false,
    )
    dispatch.email = { to: foster.email, subject: tpl.subject, html: tpl.html }
  }
  return [dispatch]
}

// ── foster reimbursements ───────────────────────────────────────────────────

async function buildFosterReimbursementApproved(
  supabase: SupabaseClient,
  e: Extract<NotifyEvent, { type: "foster.reimbursement_approved" }>,
): Promise<Dispatch[]> {
  const foster = await loadProfile(supabase, e.fosterId)
  if (!foster) return []
  const orgId = await loadFosterOrgId(supabase, foster.id)
  const link = orgId ? `${APP_URL}/org/${orgId}/foster/reimbursements` : `${APP_URL}/foster/dashboard`

  const dispatch: Dispatch = {
    recipientId: foster.id,
    push: { title: "Reimbursement approved", body: `${e.amount} (${e.category})`, url: link },
  }
  if (foster.email && prefAllows(foster, "reimbursements")) {
    const tpl = emailTemplates.reimbursementApproved(foster.name || "there", e.amount, e.category, e.notes)
    dispatch.email = { to: foster.email, subject: tpl.subject, html: tpl.html }
  }
  return [dispatch]
}

async function buildFosterReimbursementRejected(
  supabase: SupabaseClient,
  e: Extract<NotifyEvent, { type: "foster.reimbursement_rejected" }>,
): Promise<Dispatch[]> {
  const foster = await loadProfile(supabase, e.fosterId)
  if (!foster) return []
  const orgId = await loadFosterOrgId(supabase, foster.id)
  const link = orgId ? `${APP_URL}/org/${orgId}/foster/reimbursements` : `${APP_URL}/foster/dashboard`

  const dispatch: Dispatch = {
    recipientId: foster.id,
    push: { title: "Reimbursement update", body: `${e.amount} (${e.category}) was not approved`, url: link },
  }
  if (foster.email && prefAllows(foster, "reimbursements")) {
    const tpl = emailTemplates.reimbursementRejected(foster.name || "there", e.amount, e.category, e.notes)
    dispatch.email = { to: foster.email, subject: tpl.subject, html: tpl.html }
  }
  return [dispatch]
}

async function buildFosterReimbursementPaid(
  supabase: SupabaseClient,
  e: Extract<NotifyEvent, { type: "foster.reimbursement_paid" }>,
): Promise<Dispatch[]> {
  const foster = await loadProfile(supabase, e.fosterId)
  if (!foster) return []
  const orgId = await loadFosterOrgId(supabase, foster.id)
  const link = orgId ? `${APP_URL}/org/${orgId}/foster/reimbursements` : `${APP_URL}/foster/dashboard`

  const dispatch: Dispatch = {
    recipientId: foster.id,
    push: { title: "Reimbursement paid", body: `${e.amount} on ${e.paymentDate}`, url: link },
  }
  if (foster.email && prefAllows(foster, "reimbursements")) {
    const tpl = emailTemplates.reimbursementPaid(foster.name || "there", e.amount, e.category, e.paymentDate, e.paymentMethod)
    dispatch.email = { to: foster.email, subject: tpl.subject, html: tpl.html }
  }
  return [dispatch]
}

// ── admin events (fan out to org admins) ────────────────────────────────────

async function buildAdminAppointmentRequest(
  supabase: SupabaseClient,
  e: Extract<NotifyEvent, { type: "admin.appointment_request" }>,
): Promise<Dispatch[]> {
  const [admins, foster, dog, orgName] = await Promise.all([
    loadOrgAdmins(supabase, e.orgId),
    loadProfile(supabase, e.fosterId),
    loadDogName(supabase, e.dogId),
    loadOrgName(supabase, e.orgId),
  ])
  if (!admins.length) return []

  const fosterName = foster?.name || "A foster"
  const dogName = dog || "their foster"
  const link = `${APP_URL}/org/${e.orgId}/admin/appointments?view=requests`

  return adminFanout(admins, "appointment_requests", {
    push: {
      title: `Appointment request from ${fosterName}`,
      body: `${e.appointmentType} for ${dogName} on ${e.preferredDate}`,
      url: link,
    },
    emailTemplate: () =>
      emailTemplates.appointmentRequest(orgName || "your rescue", fosterName, dogName, e.appointmentType, e.preferredDate, e.orgId),
  })
}

async function buildAdminSupplyRequest(
  supabase: SupabaseClient,
  e: Extract<NotifyEvent, { type: "admin.supply_request" }>,
): Promise<Dispatch[]> {
  const [admins, foster, dog, orgName] = await Promise.all([
    loadOrgAdmins(supabase, e.orgId),
    loadProfile(supabase, e.fosterId),
    e.dogId ? loadDogName(supabase, e.dogId) : Promise.resolve<string | null>(null),
    loadOrgName(supabase, e.orgId),
  ])
  if (!admins.length) return []

  const fosterName = foster?.name || "A foster"
  const link = `${APP_URL}/org/${e.orgId}/admin/help-requests`

  return adminFanout(admins, "supply_requests", {
    push: {
      title: `Supply request from ${fosterName}`,
      body: e.supplies.slice(0, 120),
      url: link,
    },
    emailTemplate: () =>
      emailTemplates.supplyRequest(orgName || "your rescue", fosterName, e.supplies, dog || undefined, e.orgId),
  })
}

async function buildAdminReimbursementSubmitted(
  supabase: SupabaseClient,
  e: Extract<NotifyEvent, { type: "admin.reimbursement_submitted" }>,
): Promise<Dispatch[]> {
  const [admins, foster, orgName] = await Promise.all([
    loadOrgAdmins(supabase, e.orgId),
    loadProfile(supabase, e.fosterId),
    loadOrgName(supabase, e.orgId),
  ])
  if (!admins.length) return []

  const fosterName = foster?.name || "A foster"
  const link = `${APP_URL}/org/${e.orgId}/admin/reimbursements`

  return adminFanout(admins, "reimbursement_requests", {
    push: {
      title: `Reimbursement request: ${e.amount}`,
      body: `${fosterName} — ${e.category}`,
      url: link,
    },
    emailTemplate: () =>
      emailTemplates.reimbursementSubmitted(orgName || "your rescue", fosterName, e.amount, e.category, e.description),
  })
}

async function buildAdminFosterLogSubmitted(
  supabase: SupabaseClient,
  e: Extract<NotifyEvent, { type: "admin.foster_log_submitted" }>,
): Promise<Dispatch[]> {
  const [admins, foster, dog] = await Promise.all([
    loadOrgAdmins(supabase, e.orgId),
    loadProfile(supabase, e.fosterId),
    loadDogName(supabase, e.dogId),
  ])
  if (!admins.length) return []

  const fosterName = foster?.name || "A foster"
  const dogName = dog || "their foster"
  const link = `${APP_URL}/org/${e.orgId}/admin/dogs/${e.dogId}`
  const moodWord = e.mood === "great" ? "is doing great" : e.mood === "ok" ? "is doing OK" : "had a rough day"
  const isHealth = e.category === "health"

  return adminFanout(admins, "foster_log_updates", {
    push: {
      title: isHealth ? `Health update for ${dogName}` : `Update from ${fosterName}`,
      body: `${dogName} ${moodWord} — ${e.notes.slice(0, 100)}`,
      url: link,
      tag: `dog:${e.dogId}`,
    },
    emailTemplate: () => emailTemplates.fosterLogSubmitted(fosterName, dogName, e.category, e.mood, e.notes, link),
  })
}

// ── helpers ─────────────────────────────────────────────────────────────────

type ProfileRow = { id: string; name: string | null; email: string | null; notification_preferences?: any }

async function loadProfile(supabase: SupabaseClient, id: string): Promise<ProfileRow | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, name, email, notification_preferences")
    .eq("id", id)
    .maybeSingle()
  return (data as ProfileRow) || null
}

async function loadOrgName(supabase: SupabaseClient, orgId: string): Promise<string | null> {
  const { data } = await supabase.from("organizations").select("name").eq("id", orgId).maybeSingle()
  return (data?.name as string) || null
}

async function loadDogName(supabase: SupabaseClient, dogId: string): Promise<string | null> {
  const { data } = await supabase.from("dogs").select("name").eq("id", dogId).maybeSingle()
  return (data?.name as string) || null
}

async function loadFosterOrgId(supabase: SupabaseClient, fosterId: string): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("organization_id").eq("id", fosterId).maybeSingle()
  return (data?.organization_id as string) || null
}

async function loadOrgAdmins(supabase: SupabaseClient, orgId: string): Promise<ProfileRow[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id, name, email, notification_preferences")
    .eq("organization_id", orgId)
    .eq("role", "rescue")
    .eq("org_role", "org_admin")
  return (data as ProfileRow[]) || []
}

// Fan an admin event out to all org admins, applying the per-user pref check
// for the email channel only. Push always fires.
function adminFanout(
  admins: ProfileRow[],
  prefKey: NotificationPrefKey,
  payload: { push: PushPayload; emailTemplate: () => { subject: string; html: string } },
): Dispatch[] {
  return admins.map((admin) => {
    const dispatch: Dispatch = {
      recipientId: admin.id,
      push: payload.push,
    }
    if (admin.email && prefAllows(admin, prefKey)) {
      const tpl = payload.emailTemplate()
      dispatch.email = { to: admin.email, subject: tpl.subject, html: tpl.html }
    }
    return dispatch
  })
}

// Default-on read: a user who's never opened settings still gets every email.
// Setting a key to false silences only the email channel — push fires always.
function prefAllows(profile: ProfileRow, key: NotificationPrefKey): boolean {
  const prefs = profile?.notification_preferences
  if (!prefs || typeof prefs !== "object") return true
  return prefs[key] !== false
}
