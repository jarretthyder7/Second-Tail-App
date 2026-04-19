import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  // Read rescue signup intent from the cookie set just before Google OAuth was triggered.
  const cookieStore = await cookies()
  const intentCookie = cookieStore.get("oauth_signup_intent")
  let signupIntent: { role?: string; org_role?: string; orgName?: string; adminName?: string } | null = null
  if (intentCookie?.value) {
    try {
      signupIntent = JSON.parse(atob(intentCookie.value))
    } catch { /* malformed — ignore */ }
  }

  const supabase = await createClient()
  const svc = createServiceRoleClient() // service role bypasses all RLS

  // Supabase sends email confirmation links in two possible formats:
  // 1. PKCE flow (?code=...) — requires the code_verifier stored in the SAME browser
  // 2. OTP flow  (?token_hash=...&type=...) — works cross-device (email opened on phone etc.)
  // We handle both so confirmations never fail just because the user opened the link
  // on a different device than where they signed up.
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")

  let user: { id: string; email?: string; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> } | null = null

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error || !data.user) {
      console.error("Auth callback: PKCE code exchange failed", error?.message)
      return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }
    user = data.user
  } else if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "signup" | "recovery" | "invite" | "email_change" | "phone_change",
    })
    if (error || !data.user) {
      console.error("Auth callback: OTP verification failed", error?.message)
      return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }
    user = data.user
  } else {
    // No code and no token_hash — nothing to work with
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  // Password reset — redirect immediately
  if (next && next !== "/") {
    return clearAndRedirect(buildUrl(origin, request, next))
  }

  // ── Step 1: Read whatever profile exists ──
  // The handle_new_user DB trigger fires on every auth.users insert (including Google OAuth)
  // and creates a minimal profile with role='foster'. We read it first with maybeSingle
  // so we never crash on "expected 1 row, got 0".
  const { data: existingProfile } = await svc
    .from("profiles")
    .select("id, role, organization_id, name, phone, city, state, experience_level, dog_size_preference, availability")
    .eq("id", user.id)
    .maybeSingle()

  const isRescueSignup = signupIntent?.role === "rescue" && signupIntent?.org_role === "org_admin" && !!signupIntent?.orgName
  const meta = user.user_metadata || {}

  let finalProfile = existingProfile

  // ── Step 2: Handle rescue Google signup ──
  // The trigger created a foster profile. We need to upsert it to rescue + create the org.
  if (isRescueSignup) {
    // Only create a new org if the profile doesn't already have one
    let orgId = existingProfile?.organization_id ?? null

    if (!orgId) {
      const { data: newOrg, error: orgError } = await svc
        .from("organizations")
        .insert({ name: signupIntent!.orgName })
        .select("id")
        .single()

      if (orgError) {
        console.error("Auth callback: org creation failed", orgError)
      } else {
        orgId = newOrg.id
      }
    }

    // Upsert handles both "trigger already created a row" and "no row yet"
    const { data: upserted, error: upsertError } = await svc
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        name: signupIntent!.adminName || meta.name || user.email?.split("@")[0],
        role: "rescue",
        org_role: "org_admin",
        organization_id: orgId,
      }, { onConflict: "id" })
      .select("id, role, organization_id, name, phone, city, state, experience_level, dog_size_preference, availability")
      .single()

    if (upsertError) {
      console.error("Auth callback: rescue profile upsert failed", upsertError)
    } else {
      finalProfile = upserted
      // Send welcome email (fire and forget)
      fetch(`${origin}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "welcome-rescue", email: user.email, orgName: signupIntent!.orgName, adminName: signupIntent!.adminName }),
      }).catch(() => {})
    }

  // ── Step 3: Handle foster Google signup (no profile yet, or trigger missed) ──
  } else if (!existingProfile) {
    // Check for a pending invitation
    const { data: invitation } = await svc
      .from("invitations")
      .select("id, organization_id")
      .eq("email", user.email!)
      .eq("status", "pending")
      .maybeSingle()

    const { data: upserted, error: upsertError } = await svc
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        name: meta.name || user.email?.split("@")[0],
        role: "foster",
        organization_id: invitation?.organization_id ?? null,
      }, { onConflict: "id" })
      .select("id, role, organization_id, name, phone, city, state, experience_level, dog_size_preference, availability")
      .single()

    if (upsertError) {
      console.error("Auth callback: foster profile upsert failed", upsertError)
    } else {
      finalProfile = upserted

      // Welcome email
      fetch(`${origin}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "welcome-foster", email: user.email, name: meta.name || user.email?.split("@")[0] }),
      }).catch(() => {})

      // Accept invitation
      if (invitation) {
        await svc.from("invitations")
          .update({ status: "accepted", updated_at: new Date().toISOString() })
          .eq("id", invitation.id)
      }
    }
  }

  // ── Step 4: Ensure foster_profiles row exists for foster users ──
  if (finalProfile?.role === "foster") {
    const { data: fp } = await svc
      .from("foster_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!fp) {
      await svc.from("foster_profiles").insert({
        user_id: user.id,
        city: meta.city || "",
        state: meta.state || "",
        housing_type: meta.living_situation || "",
        has_yard: meta.has_yard || false,
        has_pets: meta.has_pets || false,
        existing_pets_description: meta.pets || "",
        preferred_dog_sizes: meta.dog_sizes || [],
        onboarding_completed: false,
      }).catch((e: unknown) => console.error("Auth callback: foster_profiles insert failed", e))
    }
  }

  // ── Step 5: First-time email confirmation welcome email ──
  const emailConfirmedAt = user.email_confirmed_at ? new Date(user.email_confirmed_at) : null
  const isRecentConfirmation = emailConfirmedAt && (Date.now() - emailConfirmedAt.getTime() < 60000)
  if (finalProfile?.role === "foster" && isRecentConfirmation) {
    fetch(`${origin}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "welcome-foster", email: user.email, name: finalProfile.name || user.email?.split("@")[0] }),
    }).catch(() => {})
  }

  // ── Step 6: No profile at all — send somewhere useful ──
  if (!finalProfile) {
    console.error("Auth callback: no profile after all attempts for user", user.id)
    const fallback = isRescueSignup ? `/sign-up/rescue?error=setup-incomplete` : `/login/rescue`
    return clearAndRedirect(buildUrl(origin, request, fallback))
  }

  // ── Step 7: Route by role ──
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

  return clearAndRedirect(buildUrl(origin, request, redirectPath))
}

// ── Helpers ──

function buildUrl(origin: string, request: Request, path: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host")
  const isLocal = process.env.NODE_ENV === "development"
  if (isLocal) return `${origin}${path}`
  if (forwardedHost) return `https://${forwardedHost}${path}`
  return `${origin}${path}`
}

function clearAndRedirect(destination: string): NextResponse {
  const response = NextResponse.redirect(destination)
  response.cookies.set("oauth_signup_intent", "", { maxAge: 0, path: "/" })
  return response
}
