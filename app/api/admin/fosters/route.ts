import { NextResponse } from "next/server"
import { createClient, createServiceRoleClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get("orgId")

  if (!orgId) {
    return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role, org_role, organization_id")
      .eq("id", user.id)
      .single()

    if (
      !adminProfile ||
      adminProfile.role !== "rescue" ||
      adminProfile.org_role !== "org_admin" ||
      adminProfile.organization_id !== orgId
    ) {
      return NextResponse.json({ error: "Forbidden: Not an admin of this organization" }, { status: 403 })
    }

    const serviceSupabase = await createServiceRoleClient()

    const { data: fosters, error: fostersError } = await serviceSupabase
      .from("profiles")
      .select("*")
      .eq("organization_id", orgId)
      .eq("role", "foster")
      .order("created_at", { ascending: false })

    if (fostersError) {
      console.error('Error fetching fosters:', fostersError)
    }

    // Fetch dogs for each foster
    if (fosters && fosters.length > 0) {
      const fosterIds = fosters.map((f) => f.id)
      const { data: dogsData } = await serviceSupabase
        .from("dogs")
        .select("id, name, foster_id")
        .in("foster_id", fosterIds)

      // Attach dogs to fosters
      fosters.forEach((foster: any) => {
        foster.dogs = dogsData?.filter((d) => d.foster_id === foster.id) || []
      })
    }

    const { data: pendingInvitations, error: pendingError } = await serviceSupabase
      .from("invitations")
      .select("*")
      .eq("organization_id", orgId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    const { data: acceptedInvitations, error: acceptedError } = await serviceSupabase
      .from("invitations")
      .select("*")
      .eq("organization_id", orgId)
      .eq("status", "accepted")
      .order("updated_at", { ascending: false })
      .limit(20)

    const { data: cancelledInvitations, error: cancelledError } = await serviceSupabase
      .from("invitations")
      .select("*")
      .eq("organization_id", orgId)
      .in("status", ["declined", "cancelled"])
      .order("updated_at", { ascending: false })
      .limit(10)

    const { data: availableDogs, error: dogsError } = await serviceSupabase
      .from("dogs")
      .select("id, name, breed, image_url, status")
      .eq("organization_id", orgId)
      .in("status", ["available", "fostered"])
      .order("name", { ascending: true })

    if (pendingError || acceptedError || cancelledError || dogsError) {
      console.error('Error fetching data:', { pendingError, acceptedError, cancelledError, dogsError })
    }

    return NextResponse.json({
      fosters: fosters || [],
      pendingInvitations: pendingInvitations || [],
      acceptedInvitations: acceptedInvitations || [],
      cancelledInvitations: cancelledInvitations || [],
      availableDogs: availableDogs || [],
    })
  } catch (error) {
    console.error('Error in fosters API:', error)
    const message = error instanceof Error ? error.message : "Something went wrong"
    
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return NextResponse.json(
        { error: "You do not have permission to access this resource" },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 }
    )
  }
}

// Remove fosters from an organization in bulk. Does NOT delete the foster's user account —
// just sets profiles.organization_id = null so they can join another rescue later. Also
// unassigns any dogs they were fostering and resets those dogs to "available" so the org's
// data isn't left in a broken state.
export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const ids: unknown = body?.ids
    const orgId: unknown = body?.orgId

    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((i) => typeof i === "string")) {
      return NextResponse.json({ error: "ids must be a non-empty array of strings" }, { status: 400 })
    }
    if (typeof orgId !== "string" || !orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role, org_role, organization_id")
      .eq("id", user.id)
      .single()

    if (
      !adminProfile ||
      adminProfile.role !== "rescue" ||
      adminProfile.org_role !== "org_admin" ||
      adminProfile.organization_id !== orgId
    ) {
      return NextResponse.json({ error: "Forbidden: Not an admin of this organization" }, { status: 403 })
    }

    const admin = createServiceRoleClient()

    // 1) Unassign dogs they were fostering. Scoped to the org so we can't reach across.
    const { error: dogsError } = await admin
      .from("dogs")
      .update({ foster_id: null, status: "available", stage: "available" })
      .in("foster_id", ids as string[])
      .eq("organization_id", orgId)

    if (dogsError) {
      console.error("Failed to unassign dogs while removing fosters:", dogsError)
      return NextResponse.json(
        { error: `Couldn't unassign dogs: ${dogsError.message}` },
        { status: 500 },
      )
    }

    // 2) Disassociate the foster from the org. role stays "foster" so they can rejoin later.
    const { data: removed, error: profilesError } = await admin
      .from("profiles")
      .update({ organization_id: null, org_role: null })
      .in("id", ids as string[])
      .eq("organization_id", orgId)
      .eq("role", "foster")
      .select("id")

    if (profilesError) {
      console.error("Failed to remove fosters from org:", profilesError)
      return NextResponse.json(
        { error: `Couldn't remove fosters: ${profilesError.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      removed: (removed || []).length,
      requested: ids.length,
    })
  } catch (error) {
    console.error("Bulk remove fosters error:", error)
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
