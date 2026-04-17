import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  // Parse rescue signup intent from OAuth state parameter (base64-encoded JSON)
  const stateParam = searchParams.get("state")
  let signupIntent: { role?: string; org_role?: string; orgName?: string; adminName?: string } | null = null
  if (stateParam) {
    try {
      signupIntent = JSON.parse(atob(stateParam))
    } catch {
      // Not a valid intent — ignore (could be a regular login state)
    }
  }

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
        const isRescueAdminSignup = signupIntent?.role === "rescue" && signupIntent?.org_role === "org_admin"

        if (isRescueAdminSignup && signupIntent?.orgName) {
          // Create the organization first
          const { data: newOrg, error: orgError } = await supabase
            .from("organizations")
            .insert({
              name: signupIntent.orgName,
            })
            .select()
            .single()

          if (orgError) {
            console.error("[v0] Error creating organization:", orgError)
          }

          // Create rescue admin profile linked to the new org
          const { data: newProfile, error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              email: data.user.email,
              name: signupIntent.adminName || data.user.user_metadata?.name || data.user.email?.split("@")[0],
              role: "rescue",
              org_role: "org_admin",
              organization_id: newOrg?.id ?? null,
            })
            .select()
            .single()

          if (profileError) {
            console.error("[v0] Error creating rescue admin profile:", profileError)
          } else {
            profile = newProfile
          }
        } else {
          // Standard foster OAuth/email signup path
          const meta = data.user.user_metadata || {}

          // Check for pending invitation by email
          const { data: invitation } = await supabase
            .from("invitations")
            .select("id, organization_id")
            .eq("email", data.user.email!)
            .eq("status", "pending")
            .maybeSingle()

          const organizationId = invitation?.organization_id || null

          // Use service role client to bypass RLS for new unconfirmed users
          const serviceClient = createServiceRoleClient()

          const { data: newProfile, error: profileError } = await serviceClient
            .from("profiles")
            .insert({
              id: data.user.id,
              email: data.user.email,
              name: meta.name || data.user.email?.split("@")[0],
              role: "foster",
              organization_id: organizationId,
            })
            .select()
            .single()

          if (profileError) {
            console.error("Error creating foster profile:", profileError)
          } else {
            profile = newProfile

            // Send welcome email now that email is confirmed
            try {
              await fetch(`${origin}/api/email/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "welcome-foster",
                  email: data.user.email,
                  name: meta.name || data.user.email?.split("@")[0],
                }),
              })
            } catch {
              // Welcome email failed but signup succeeded
            }

            // Create foster_profiles row using vetting data from signup metadata
            await serviceClient.from("foster_profiles").insert({
              user_id: data.user.id,
              city: meta.city || "",
              state: meta.state || "",
              housing_type: meta.living_situation || "",
              has_yard: meta.has_yard || false,
              has_pets: meta.has_pets || false,
              existing_pets_description: meta.pets || "",
              preferred_dog_sizes: meta.dog_sizes || [],
              onboarding_completed: false,
            })

            // Accept invitation if one exists
            if (invitation) {
              await serviceClient
                .from("invitations")
                .update({ status: "accepted", updated_at: new Date().toISOString() })
                .eq("id", invitation.id)
            }
          }
        }
      }

      // If profile lookup failed entirely, send to login
      if (!profile) {
        const forwardedHost = request.headers.get("x-forwarded-host")
        const isLocalEnv = process.env.NODE_ENV === "development"
        const fallback = `/?message=please-sign-in`
        if (isLocalEnv) return NextResponse.redirect(`${origin}${fallback}`)
        if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${fallback}`)
        return NextResponse.redirect(`${origin}${fallback}`)
      }

      let redirectPath = next

      const isProfileIncomplete =
        !profile.name ||
        !profile.phone ||
        !profile.city ||
        !profile.state ||
        !profile.experience_level ||
        !profile.dog_size_preference?.length ||
        !profile.availability

      // Redirect rescue admin users
      if (profile.role === "rescue") {
        if (profile.organization_id) {
          // New users start at setup wizard; existing (complete) users go to dashboard
          redirectPath = `/org/${profile.organization_id}/admin/setup-wizard`
        } else {
          // Rescue user with no org — something went wrong during signup
          redirectPath = `/sign-up/rescue?error=setup-incomplete`
        }
      }
      // Redirect fosters: new signups go to onboarding, returning users go to their dashboard
      else if (profile.role === "foster") {
        if (isProfileIncomplete) {
          // New foster completing email verification — send to onboarding
          redirectPath = "/foster/onboarding"
        } else if (profile.organization_id) {
          redirectPath = `/org/${profile.organization_id}/foster/dashboard`
        } else {
          redirectPath = "/foster/dashboard"
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

