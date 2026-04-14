import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Query for organizations (public info only)
    const { data: organizations, error } = await supabase
      .from("organizations")
      .select("id, name, city, state")

    if (error) {
      console.error("[v0] Error fetching public organizations:", error)
      return NextResponse.json(
        { error: "Failed to fetch organizations" },
        { status: 500 }
      )
    }

    return NextResponse.json(organizations)
  } catch (error) {
    console.error("[v0] Unexpected error in GET /api/public/organizations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
