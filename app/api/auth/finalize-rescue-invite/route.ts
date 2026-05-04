import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// POST /api/auth/finalize-rescue-invite
// Called by /auth/invite after the rescue sets their password. Reads the
// metadata we attached at invite time (role=rescue, org_role=org_admin,
// org_name, name, city, state) and provisions:
//   - a row in `organizations`
//   - the user's `profiles` row pointed at the new org
// Idempotent: if a profile already has an org, we return that org id.
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }

  const meta = (user.user_metadata || {}) as Record<string, unknown>
  const role = typeof meta.role === "string" ? meta.role : ""
  const orgRole = typeof meta.org_role === "string" ? meta.org_role : ""
  const orgName = typeof meta.org_name === "string" ? meta.org_name.trim() : ""
  const name = typeof meta.name === "string" ? meta.name.trim() : (user.email?.split("@")[0] || "")
  const city = typeof meta.city === "string" ? meta.city.trim() : ""
  const state = typeof meta.state === "string" ? meta.state.trim() : ""

  if (role !== "rescue" || orgRole !== "org_admin" || !orgName) {
    return NextResponse.json(
      { error: "Invite metadata is missing or incomplete. Ask the admin to re-send the invite." },
      { status: 400 },
    )
  }

  const svc = createServiceRoleClient()

  // If a profile already exists with an org, treat this as idempotent.
  const { data: existingProfile } = await svc
    .from("profiles")
    .select("id, organization_id")
    .eq("id", user.id)
    .maybeSingle()

  let orgId = existingProfile?.organization_id ?? null

  if (!orgId) {
    const { data: newOrg, error: orgError } = await svc
      .from("organizations")
      .insert({
        name: orgName,
        city: city || null,
        state: state || null,
      })
      .select("id")
      .single()
    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 500 })
    }
    orgId = newOrg.id
  }

  const { error: upsertError } = await svc
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        name,
        role: "rescue",
        org_role: "org_admin",
        organization_id: orgId,
      },
      { onConflict: "id" },
    )
  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  return NextResponse.json({ organizationId: orgId })
}
