import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dogId = params.id

    if (!dogId || dogId === "undefined" || dogId === "null") {
      return NextResponse.json({ error: "Invalid dog ID", dogId }, { status: 400 })
    }

    let supabase
    try {
      supabase = createServiceRoleClient()
    } catch (clientError) {
      console.error("[v0] Failed to create service role client:", clientError)
      return NextResponse.json(
        {
          error: "Database configuration error",
          message: clientError instanceof Error ? clientError.message : "Could not create database client",
        },
        { status: 500 },
      )
    }

    const { data: dog, error: dogError } = await supabase.from("dogs").select("*").eq("id", dogId).maybeSingle()

    if (dogError) {
      console.error("[v0] Database error fetching dog:", {
        message: dogError.message,
        code: dogError.code,
        details: dogError.details,
        hint: dogError.hint,
        dogId,
      })
      return NextResponse.json(
        {
          error: "Database error",
          message: dogError.message,
          code: dogError.code,
          dogId,
        },
        { status: 500 },
      )
    }

    if (!dog) {
      console.error("[v0] Dog not found in database:", dogId)
      return NextResponse.json({ error: "Dog not found", dogId }, { status: 404 })
    }

    if (dog.foster_id) {
      const { data: foster } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", dog.foster_id)
        .maybeSingle()

      if (foster) {
        dog.foster = foster
      }
    }

    if (dog.organization_id) {
      const { data: organization } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", dog.organization_id)
        .maybeSingle()

      if (organization) {
        dog.organization = organization
      }
    }

    return NextResponse.json(dog)
  } catch (error) {
    console.error("[v0] Error in dogs API:", error)
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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dogId = params.id
    const body = await request.json()

    console.log("[v0] PATCH /api/dogs/" + dogId, "with data:", Object.keys(body))

    const supabase = createServiceRoleClient()

    const { data: updatedDog, error } = await supabase
      .from("dogs")
      .update(body)
      .eq("id", dogId)
      .select("*")
      .maybeSingle()

    if (error) {
      console.error("[v0] Error updating dog:", error)
      return NextResponse.json({ error: "Failed to update dog", details: error.message }, { status: 400 })
    }

    if (!updatedDog) {
      return NextResponse.json({ error: "Dog not found" }, { status: 404 })
    }

    // Fetch related data
    if (updatedDog.foster_id) {
      const { data: foster } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", updatedDog.foster_id)
        .maybeSingle()

      if (foster) {
        updatedDog.foster = foster
      }
    }

    if (updatedDog.organization_id) {
      const { data: organization } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", updatedDog.organization_id)
        .maybeSingle()

      if (organization) {
        updatedDog.organization = organization
      }
    }

    return NextResponse.json(updatedDog)
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
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
