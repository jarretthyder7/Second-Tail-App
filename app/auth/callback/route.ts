import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      let { data: profile } = await supabase
        .from("profiles")
        .select("role, organization_id, name, phone, city, state, experience_level, dog_size_preference, availability")
        .eq("id", data.user.id)
        .single()

      // If no profile exists (Google OAuth signup), create one
      if (!profile) {
        console.log("[v0] No profile found, creating new profile for:", data.user.email)

        // Check if user has pending invitations
        const { data: invitation } = await supabase
          .from("invitations")
          .select("*, organization:organizations!organization_id(id, name)")
          .eq("email", data.user.email!)
          .eq("status", "pending")
          .maybeSingle()

        // Create profile with organization if invited
        const { data: newProfile, error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
            role: "foster",
            organization_id: invitation ? invitation.organization_id : null,
          })
          .select()
          .single()

        if (profileError) {
          console.error("[v0] Error creating profile:", profileError)
        } else {
          profile = newProfile

          // Accept invitation if exists
          if (invitation) {
            await supabase
              .from("invitations")
              .update({
                status: "accepted",
                updated_at: new Date().toISOString(),
              })
              .eq("id", invitation.id)

            console.log("[v0] Auto-accepted invitation from:", invitation.organization?.name)
          }
        }
      }

      let redirectPath = next

      if (profile) {
        const isProfileIncomplete =
          !profile.name ||
          !profile.phone ||
          !profile.city ||
          !profile.state ||
          !profile.experience_level ||
          !profile.dog_size_preference?.length ||
          !profile.availability

        // Redirect rescue users to their org dashboard
        if (profile.role === "rescue" && profile.organization_id) {
          redirectPath = `/org/${profile.organization_id}/admin/dashboard`
        }
        // Redirect fosters to unassigned dashboard if no org, or org dashboard if assigned
        else if (profile.role === "foster") {
          if (isProfileIncomplete) {
            redirectPath = "/foster/onboarding"
          } else if (profile.organization_id) {
            redirectPath = `/org/${profile.organization_id}/foster/dashboard`
          } else {
            redirectPath = "/foster/dashboard"
          }
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
