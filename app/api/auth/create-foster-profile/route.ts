import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { userId, email, name, city, state, livingSituation, pets, dogSizes } = await request.json()

    const supabase = createServiceRoleClient()

    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      email,
      name,
      role: "foster",
      organization_id: null,
    })

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    const { error: fosterProfileError } = await supabase.from("foster_profiles").insert({
      user_id: userId,
      city,
      state,
      housing_type: livingSituation,
      has_yard: livingSituation.toLowerCase().includes("yard"),
      has_pets: pets.length > 0 && !pets.includes("None"),
      existing_pets_description: pets.join(", "),
      preferred_dog_sizes: dogSizes,
      onboarding_completed: false,
    })

    if (fosterProfileError) {
      return NextResponse.json({ error: fosterProfileError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
  }
}
