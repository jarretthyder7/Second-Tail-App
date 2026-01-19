import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { fosterId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get("orgId")
    const fosterId = params.fosterId

    console.log("[v0] ==========================================================")
    console.log("[v0] API Request: GET /api/admin/foster/" + fosterId)
    console.log("[v0] Organization ID:", orgId)
    console.log("[v0] Timestamp:", new Date().toISOString())
    console.log("[v0] ==========================================================")

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
    }

    if (!fosterId || fosterId === "undefined" || fosterId === "null") {
      console.error("[v0] ❌ Invalid foster ID:", fosterId)
      return NextResponse.json({ error: "Invalid foster ID", fosterId }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { data: foster, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", fosterId)
      .eq("organization_id", orgId)
      .maybeSingle()

    console.log("[v0] Query completed:")
    console.log("[v0]   - Has Error:", !!error)
    console.log("[v0]   - Has Data:", !!foster)

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
      console.log("[v0] ⚠️ Foster not found for ID:", fosterId, "in org:", orgId)
      return NextResponse.json(
        {
          error: "Foster not found",
          fosterId,
          orgId,
        },
        { status: 404 },
      )
    }

    console.log("[v0] ✓ Foster found:", foster.email)

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

    console.log("[v0] ✓ Found", dogs?.length || 0, "assigned dogs")
    foster.dogs = dogs || []

    console.log("[v0] ==========================================================")
    console.log("[v0] ✓ Successfully returning foster data")
    console.log("[v0] ==========================================================")
    return NextResponse.json(foster)
  } catch (error) {
    console.error("[v0] ==========================================================")
    console.error("[v0] ❌ Unexpected error in foster API:")
    console.error("[v0]", error)
    console.error("[v0] Stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("[v0] ==========================================================")
    return NextResponse.json(
      {
        error: "Server error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { fosterId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get("orgId")
    const fosterId = params.fosterId

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
    }

    if (!fosterId || fosterId === "undefined" || fosterId === "null") {
      return NextResponse.json({ error: "Invalid foster ID", fosterId }, { status: 400 })
    }

    const body = await request.json()
    const { name, phone, address } = body

    const supabase = createServiceRoleClient()

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
