import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { canAccessDog } from "@/lib/api/auth-helpers"

const PATCHABLE_DOG_FIELDS = [
  "name",
  "breed",
  "age",
  "gender",
  "weight",
  "status",
  "medical_notes",
  "behavior_notes",
  "foster_id",
  "image_url",
  "intake_date",
] as const

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dogId = params.id

    if (!dogId || dogId === "undefined" || dogId === "null") {
      return NextResponse.json({ error: "Invalid dog ID", dogId }, { status: 400 })
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

    if (profileError || !profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: dog, error: dogError } = await supabase.from("dogs").select("*").eq("id", dogId).maybeSingle()

    if (dogError) {
      console.error("[v0] Database error fetching dog:", dogError.message, dogId)
      return NextResponse.json({ error: "Database error", message: dogError.message }, { status: 500 })
    }

    if (!dog) {
      return NextResponse.json({ error: "Dog not found", dogId }, { status: 404 })
    }

    if (!canAccessDog(profile, dog)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dogId = params.id
    const body = await request.json()

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

    if (profileError || !profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: dog, error: dogError } = await supabase.from("dogs").select("*").eq("id", dogId).maybeSingle()

    if (dogError) {
      console.error("[v0] Error loading dog for PATCH:", dogError.message)
      return NextResponse.json({ error: "Database error", message: dogError.message }, { status: 500 })
    }

    if (!dog) {
      return NextResponse.json({ error: "Dog not found" }, { status: 404 })
    }

    if (!canAccessDog(profile, dog)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of PATCHABLE_DOG_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updates[key] = body[key]
      }
    }

    const { data: updatedDog, error } = await supabase
      .from("dogs")
      .update(updates)
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
      },
      { status: 500 },
    )
  }
}
