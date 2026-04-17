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
      return NextResponse.json(
        { error: "Failed to fetch organizations" },
        { status: 500 }
      )
    }

    return NextResponse.json(organizations)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
