import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
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
    const { name, phone, address, reimbursements_enabled } = body
    // Build a partial update so callers can patch a single field (the foster
    // detail page sends only `reimbursements_enabled` for the override toggle).
    const updates: Record<string, unknown> = {}
    if (typeof name !== "undefined") updates.name = name
    if (typeof phone !== "undefined") updates.phone = phone
    if (typeof address !== "undefined") updates.address = address
    if (typeof reimbursements_enabled !== "undefined") {
      // Accept null (inherit), true (force on), false (force off)
      if (
        reimbursements_enabled === null ||
        reimbursements_enabled === true ||
        reimbursements_enabled === false
      ) {
        updates.reimbursements_enabled = reimbursements_enabled
      }
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 })
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
      .select("id, role, organization_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || !isRescueInOrg(profile, orgId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: updatedFoster, error } = await supabase
      .from("profiles")
      .update(updates)
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
