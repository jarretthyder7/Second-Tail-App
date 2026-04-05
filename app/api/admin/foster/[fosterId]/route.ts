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
      console.error("[v0] Database error fetching foster:", error)
      return NextResponse.json(
        {
          error: "Database error",
          message: error.message,
          fosterId,
        },
        { status: 500 },
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
    console.error("[v0] Unexpected error in foster API:", error)
    return NextResponse.json(
      {
        error: "Server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
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
      console.error("[v0] Error updating foster:", error)
      return NextResponse.json(
        {
          error: "Database error",
          message: error.message,
        },
        { status: 500 },
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
    console.error("[v0] Error in foster PATCH handler:", error)
    return NextResponse.json(
      {
        error: "Server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
