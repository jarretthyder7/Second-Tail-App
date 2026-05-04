import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isPlatformAdminEmail } from "@/lib/api/platform-admin"

// POST /api/admin/rescue-waitlist/[id]/accept
// Sends a Supabase invite email to the waitlisted rescue and marks the row
// accepted. The invite email contains a magic link that lands the user in the
// "set your password" flow; once they confirm, the auth callback at
// /app/auth/callback uses the user_metadata we set here (role=rescue,
// org_role=org_admin, org_name, ...) to auto-create their org + profile.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Waitlist entry id required" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!isPlatformAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const admin = createServiceRoleClient()

  const { data: entry, error: entryError } = await admin
    .from("rescue_waitlist")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (entryError) {
    return NextResponse.json({ error: entryError.message }, { status: 500 })
  }
  if (!entry) {
    return NextResponse.json({ error: "Waitlist entry not found" }, { status: 404 })
  }
  if (entry.status === "accepted") {
    return NextResponse.json({ error: "Already accepted" }, { status: 409 })
  }

  // Site URL controls where the magic link redirects. Vercel sets
  // NEXT_PUBLIC_SITE_URL or VERCEL_URL; fall back to production.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://getsecondtail.com")

  const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(entry.email, {
    // The rescue lands on /auth/invite which parses the implicit-flow token
    // from the URL hash, asks them to set a password, then finalizes their
    // org + profile via /api/auth/finalize-rescue-invite using the metadata
    // attached below.
    redirectTo: `${siteUrl}/auth/invite`,
    data: {
      role: "rescue",
      org_role: "org_admin",
      org_name: entry.org_name,
      name: entry.contact_name,
      city: entry.city || "",
      state: entry.state || "",
    },
  })
  if (inviteError) {
    // Common case: user already exists in auth (e.g. they signed up directly).
    // In that case we still want to mark accepted but let the caller know.
    const message = inviteError.message || "Failed to send invite"
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const { error: updateError } = await admin
    .from("rescue_waitlist")
    .update({ status: "accepted" })
    .eq("id", id)
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, invitedUserId: invite?.user?.id || null })
}
