import { type NextRequest, NextResponse } from "next/server"
import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { isRescueInOrg } from "@/lib/api/auth-helpers"

export async function GET(request: NextRequest, { params }: { params: Promise<{ fosterId: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get("orgId")
    const { fosterId } = await params

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
    }

    if (!fosterId || fosterId === "undefined" || fosterId === "null") {
      return NextResponse.json({ error: "Invalid foster ID", fosterId }, { status: 400 })
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

    if (profileError || !profile || !isRescueInOrg(profile, orgId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: foster, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", fosterId)
      .eq("organization_id", orgId)
      .maybeSingle()

    if (error) {
      console.error('Database error fetching foster:', error)
      return NextResponse.json(
        { error: "Failed to fetch foster details" },
        { status: 500 }
      )
    }

    if (!foster) {
      return NextResponse.json(
        {
          error: "Foster not found",
          fosterId,
          orgId,
        },
        { status: 404 },
      )
    }

    if (foster.organization_id) {
      const { data: organization } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", foster.organization_id)
        .maybeSingle()

      if (organization) {
        foster.organization = organization
      }
    }

    const { data: dogs } = await supabase
      .from("dogs")
      .select("id, name, breed, image_url, status")
      .eq("foster_id", fosterId)

    foster.dogs = dogs || []

    return NextResponse.json(foster)
  } catch (error) {
    console.error('Error in foster API:', error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to fetch foster details" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ fosterId: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get("orgId")
    const { fosterId } = await params

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
    }

    if (!fosterId || fosterId === "undefined" || fosterId === "null") {
      return NextResponse.json({ error: "Invalid foster ID", fosterId }, { status: 400 })
    }

    const body = await request.json()
    const { name, phone, address } = body

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, organization_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || !isRescueInOrg(profile, orgId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: updatedFoster, error } = await supabase
      .from("profiles")
      .update({
        name,
        phone,
        address,
      })
      .eq("id", fosterId)
      .eq("organization_id", orgId)
      .select()
      .single()

    if (error) {
      console.error('Error updating foster:', error)
      return NextResponse.json(
        { error: "Failed to update foster details" },
        { status: 500 }
      )
    }

    if (!updatedFoster) {
      return NextResponse.json(
        {
          error: "Foster not found",
          fosterId,
        },
        { status: 404 },
      )
    }

    return NextResponse.json(updatedFoster)
  } catch (error) {
    console.error('Error in foster PATCH handler:', error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to update foster details" },
      { status: 500 }
    )
  }
}

/**
 * Remove a foster from this rescue's network.
 * - Unassigns any dogs they have (dogs.foster_id = null)
 * - Marks removal timestamp on foster_profiles (if column exists)
 * - Clears profiles.organization_id so they land on the unconnected dashboard
 *
 * Only accessible to org admins of the specified orgId.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ fosterId: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get("orgId")
    const { fosterId } = await params

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
    }
    if (!fosterId || fosterId === "undefined" || fosterId === "null") {
      return NextResponse.json({ error: "Invalid foster ID" }, { status: 400 })
    }

    // Auth: caller must be a rescue admin of this org.
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, organization_id, org_role")
      .eq("id", user.id)
      .single()
    if (!profile || !isRescueInOrg(profile, orgId) || profile.org_role !== 'org_admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Use service role for the writes — we need to update rows the admin user
    // doesn't own directly (foster's profile + foster_profiles row).
    const svc = createServiceRoleClient()

    // Verify the target is actually a foster in this org.
    const { data: target } = await svc
      .from("profiles")
      .select("id, role, organization_id")
      .eq("id", fosterId)
      .maybeSingle()
    if (!target) {
      return NextResponse.json({ error: "Foster not found" }, { status: 404 })
    }
    if (target.organization_id !== orgId) {
      return NextResponse.json({ error: "Foster is not in your organization" }, { status: 400 })
    }
    if (target.role !== 'foster') {
      return NextResponse.json({ error: "Target is not a foster" }, { status: 400 })
    }

    // 1. Unassign any dogs they currently foster in THIS org.
    const { error: dogsErr } = await svc
      .from("dogs")
      .update({ foster_id: null, stage: "intake", status: "available", updated_at: new Date().toISOString() })
      .eq("foster_id", fosterId)
      .eq("organization_id", orgId)
    if (dogsErr) {
      console.error('[remove foster] dog unassign failed:', dogsErr.message)
      // Not fatal — continue; admin can clean up manually if needed.
    }

    // 2. Mark removal timestamp on foster_profiles. If the column doesn't
    //    exist yet, the update will fail silently — we log and continue.
    try {
      await svc
        .from("foster_profiles")
        .update({ removed_from_org_at: new Date().toISOString() })
        .eq("user_id", fosterId)
    } catch (err) {
      console.error('[remove foster] removed_from_org_at update skipped:', err)
    }

    // 3. Clear the foster's organization_id so middleware sends them to the
    //    unconnected dashboard.
    const { error: profileErr } = await svc
      .from("profiles")
      .update({ organization_id: null })
      .eq("id", fosterId)
      .eq("organization_id", orgId) // Scope — don't null someone else's org
    if (profileErr) {
      console.error('[remove foster] profile update failed:', profileErr.message)
      return NextResponse.json({ error: "Failed to remove foster" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in foster DELETE handler:', error)
    return NextResponse.json({ error: "Failed to remove foster" }, { status: 500 })
  }
}
