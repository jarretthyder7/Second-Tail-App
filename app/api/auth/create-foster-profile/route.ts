import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { sendWelcomeEmailFoster } from "@/lib/email/send"

export async function POST(request: Request) {
  try {
    const { userId, email, name, city, state, livingSituation, pets, dogSizes } = await request.json()

    const supabase = createServiceRoleClient()

    // Create profile row
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      email,
      name,
      role: "foster",
      organization_id: null,
    })

    if (profileError && profileError.code !== "23505") {
      // 23505 = unique violation (already exists), safe to ignore
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // Create foster_profiles row
    const { error: fosterProfileError } = await supabase.from("foster_profiles").insert({
      user_id: userId,
      city: city || "",
      state: state || "",
      housing_type: livingSituation || "",
      has_yard: (livingSituation || "").toLowerCase().includes("yard"),
      has_pets: Array.isArray(pets) && pets.length > 0 && !pets.includes("None"),
      existing_pets_description: Array.isArray(pets) ? pets.join(", ") : "",
      preferred_dog_sizes: dogSizes || [],
      onboarding_completed: false,
    })

    if (fosterProfileError && fosterProfileError.code !== "23505") {
      return NextResponse.json({ error: fosterProfileError.message }, { status: 400 })
    }

    // Generate a confirmation link server-side using the service role admin API
    const origin = request.headers.get("origin") || "https://getsecondtail.com"
    const redirectTo = `${origin}/auth/callback`

    let confirmationUrl: string | undefined

    try {
      const { data: linkData, error: linkError } = await (supabase.auth.admin as any).generateLink({
        type: "signup",
        email,
        options: { redirectTo },
      })

      if (!linkError && linkData?.properties?.action_link) {
        confirmationUrl = linkData.properties.action_link
      }
    } catch {
      // If link generation fails, the email will still send without a button
    }

    // Send branded welcome email with confirmation CTA
    await sendWelcomeEmailFoster(email, name, undefined, confirmationUrl)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
  }
}
