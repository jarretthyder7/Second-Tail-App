import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  // Read rescue signup intent from the cookie set just before Google OAuth was triggered.
  // We can't use query params because Supabase drops custom params during its redirect chain.
  const cookieStore = await cookies()
  const intentCookie = cookieStore.get("oauth_signup_intent")
  let signupIntent: { role?: string; org_role?: string; orgName?: string; adminName?: string } | null = null
  if (intentCookie?.value) {
    try {
      signupIntent = JSON.parse(atob(intentCookie.value))
    } catch {
      // Malformed cookie — ignore
    }
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  const supabase = await createClient()
  const serviceClient = createServiceRoleClient()

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    console.error("Auth callback: code exchange failed", error)
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  const user = data.user

  // Password reset flow — just redirect immediately
  if (next && next !== "/") {
    const dest = buildUrl(origin, request, next)
    return clearIntentAndRedirect(dest)
  }

  // ── 1. Look up existing profile ──
  // Try service role to bypass any RLS issues on the select
  const { data: profile, error: profileSelectError } = await serviceClient
    .from("profiles")
    .select("role, organization_id, name, phone, city, state, experience_level, dog_size_preference, availability")
    .eq("id", user.id)
    .single()

  if (profileSelectError && profileSelectError.code !== "PGRST116") {
    // PGRST116 = "not found" — anything else is a real DB error
    console.error("Auth callback: profile select error", profileSelectError)
  }

  // ── 2. First-time email confirmation welcome email ──
  const emailConfirmedAt = user.email_confirmed_at ? new Date(user.email_confirmed_at) : null
  const isRecentConfirmation = emailConfirmedAt && (Date.now() - emailConfirmedAt.getTime() < 60000)
  if (profile && profile.role === "foster" && isRecentConfirmation) {
    fetch(`${origin}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "welcome-foster", email: user.email, name: profile.name || user.email?.split("@")[0] }),
    }).catch(() => {})
  }

  // ── 3. No profile yet — create one ──
  let finalProfile = profile

  if (!finalProfile) {
    const isRescueSignup = signupIntent?.role === "rescue" && signupIntent?.org_role === "org_admin"

    if (isRescueSignup && signupIntent?.orgName) {
      // ── Rescue admin Google signup ──
      // Use service role for ALL inserts to bypass RLS on new unconfirmed users
      const { data: newOrg, error: orgError } = await serviceClient
        .from("organizations")
        .insert({ name: signupIntent.orgName })
        .select()
        .single()

      if (orgError) {
        console.error("Auth callback: org creation failed", orgError)
      }

      const { data: newProfile, error: profileError } = await serviceClient
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          name: signupIntent.adminName || user.user_metadata?.name || user.email?.split("@")[0],
          role: "rescue",
          org_role: "org_admin",
          organization_id: newOrg?.id ?? null,
        })
        .select()
        .single()

      if (profileError) {
        console.error("Auth callback: rescue profile creation failed", profileError)
      } else {
        finalProfile = newProfile
        // Send welcome email to the new rescue admin
        fetch(`${origin}/api/email/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "welcome-rescue", email: user.email, orgName: signupIntent.orgName, adminName: signupIntent.adminName }),
        }).catch(() => {})
      }

    } else {
      // ── Foster Google / email signup ──
      const meta = user.user_metadata || {}

      // Check for a pending invitation
      const { data: invitation } = await serviceClient
        .from("invitations")
        .select("id, organization_id")
        .eq("email", user.email!)
        .eq("status", "pending")
        .maybeSingle()

      const { data: newProfile, error: profileError } = await serviceClient
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          name: meta.name || user.email?.split("@")[0],
          role: "foster",
          organization_id: invitation?.organization_id || null,
        })
        .select()
        .single()

      if (profileError) {
        console.error("Auth callback: foster profile creation failed", profileError)
      } else {
        finalProfile = newProfile

        // Welcome email
        fetch(`${origin}/api/email/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "welcome-foster", email: user.email, name: meta.name || user.email?.split("@")[0] }),
        }).catch(() => {})

        // Foster profile row
        await serviceClient.from("foster_profiles").insert({
          user_id: user.id,
          city: meta.city || "",
          state: meta.state || "",
          housing_type: meta.living_situation || "",
          has_yard: meta.has_yard || false,
          has_pets: meta.has_pets || false,
          existing_pets_description: meta.pets || "",
          preferred_dog_sizes: meta.dog_sizes || [],
          onboarding_completed: false,
        })

        // Accept invitation
        if (invitation) {
          await serviceClient
            .from("invitations")
            .update({ status: "accepted", updated_at: new Date().toISOString() })
            .eq("id", invitation.id)
        }
      }
    }
  }

  // ── 4. Still no profile — send them somewhere useful ──
  if (!finalProfile) {
    console.error("Auth callback: no profile after all attempts for user", user.id)
    const isRescue = signupIntent?.role === "rescue"
    const fallback = isRescue ? `/sign-up/rescue?error=setup-incomplete` : `/login/foster?error=auth-failed`
    return clearIntentAndRedirect(buildUrl(origin, request, fallback))
  }

  // ── 5. Route based on role ──
  let redirectPath = "/"

  if (finalProfile.role === "rescue") {
    redirectPath = finalProfile.organization_id
      ? `/org/${finalProfile.organization_id}/admin/setup-wizard`
      : `/sign-up/rescue?error=setup-incomplete`
  } else if (finalProfile.role === "foster") {
    redirectPath = finalProfile.organization_id
      ? `/org/${finalProfile.organization_id}/foster/dashboard`
      : `/foster/dashboard`
  }

  return clearIntentAndRedirect(buildUrl(origin, request, redirectPath))
}

// ── Helpers ──

function buildUrl(origin: string, request: Request, path: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host")
  const isLocal = process.env.NODE_ENV === "development"
  if (isLocal) return `${origin}${path}`
  if (forwardedHost) return `https://${forwardedHost}${path}`
  return `${origin}${path}`
}

function clearIntentAndRedirect(destination: string): NextResponse {
  const response = NextResponse.redirect(destination)
  response.cookies.set("oauth_signup_intent", "", { maxAge: 0, path: "/" })
  return response
}
