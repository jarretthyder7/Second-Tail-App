import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isRescueInOrg } from "@/lib/api/auth-helpers"

const ALLOWED_STATUSES = new Set(["pending", "scheduled", "declined", "cancelled", "confirmed"])

// PATCH /api/admin/appointment-requests/[id]
// Used by rescue admins to change a foster-submitted request's status (decline,
// schedule, confirm). Auth: rescue staff in the row's organization.
//
// We authorize via the user-scoped client, then write via the service-role
// client. RLS on appointment_requests only lets fosters update their own rows;
// rescue admins need to act on behalf of the org, so we bypass RLS after the
// authorization check.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Request ID required" }, { status: 400 })
  }

  let body: { status?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const status = body.status
  if (!status || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, organization_id, org_role")
    .eq("id", user.id)
    .single()
  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 })
  }

  // Look up the row's org so we can enforce the rescue belongs to it
  const { data: existing, error: existingError } = await supabase
    .from("appointment_requests")
    .select("id, organization_id")
    .eq("id", id)
    .maybeSingle()
  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }
  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 })
  }
  if (!isRescueInOrg(profile, existing.organization_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const admin = createServiceRoleClient()
  const { data: updated, error: updateError } = await admin
    .from("appointment_requests")
    .update({ status })
    .eq("id", id)
    .select("id, status")
    .single()
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ request: updated })
}
