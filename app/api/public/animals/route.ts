import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Query for publicly listed dogs with organization info
    const { data: dogs, error } = await supabase
      .from("dogs")
      .select(
        `
        id,
        name,
        breed,
        size,
        organization_id,
        organizations!inner (
          id,
          name,
          state
        )
      `
      )
      .eq("public_listing", true)

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch animals" },
        { status: 500 }
      )
    }

    // Format the response
    const formattedDogs = dogs.map((dog: any) => ({
      id: dog.id,
      name: dog.name,
      breed: dog.breed,
      size: dog.size,
      organization_id: dog.organization_id,
      org_name: dog.organizations.name,
      org_state: dog.organizations.state,
    }))

    return NextResponse.json(formattedDogs)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
