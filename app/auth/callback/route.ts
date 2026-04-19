import { createServerClient } from "@supabase/ssr"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
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

  // ── Build Supabase auth client that writes session cookies DIRECTLY onto the
  //    final redirect response (not via next/headers which doesn't auto-merge). ──
  const sessionCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Capture instead of writing to next/headers — we'll copy them to the
          // redirect response ourselves so they actually survive the redirect.
          cookiesToSet.forEach((c) => sessionCookies.push(c as typeof sessionCookies[number]))
        },
      },
    },
  )

  const svc = createServiceRoleClient() // service role bypasses all RLS

  // Supabase sends email confirmation links in two possible formats:
  // 1. PKCE flow (?code=...) — requires the code_verifier stored in the SAME browser
  // 2. OTP flow  (?token_hash=...&type=...) — works cross-device (email opened on phone etc.)
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

  // Password reset — redirect immediately (session cookies still needed)
  if (next && next !== "/") {
    return buildRedirect(buildUrl(origin, request, next), sessionCookies)
  }

  // ── Step 1: Read whatever profile exists ──
  const { data: existingProfile } = await svc
    .from("profiles")
    .select("id, role, organization_id, name, phone, city, state, experience_level, dog_size_preference, availability")
    .eq("id", user.id)
    .maybeSingle()

  const isRescueSignup = signupIntent?.role === "rescue" && signupIntent?.org_role === "org_admin" && !!signupIntent?.orgName
  const meta = user.user_metadata || {}

  let finalProfile = existingProfile

  // ── Step 2: Handle rescue Google signup ──
  if (isRescueSignup) {
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
      fetch(`${origin}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "welcome-rescue", email: user.email, orgName: signupIntent!.orgName, adminName: signupIntent!.adminName }),
      }).catch(() => {})
    }

  // ── Step 3: Handle foster Google signup (no profile yet, or trigger missed) ──
  } else if (!existingProfile) {
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

      fetch(`${origin}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "welcome-foster", email: user.email, name: meta.name || user.email?.split("@")[0] }),
      }).catch(() => {})

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
    return buildRedirect(buildUrl(origin, request, fallback), sessionCookies)
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

  return buildRedirect(buildUrl(origin, request, redirectPath), sessionCookies)
}

// ── Helpers ──

function buildUrl(origin: string, request: NextRequest, path: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host")
  const isLocal = process.env.NODE_ENV === "development"
  if (isLocal) return `${origin}${path}`
  if (forwardedHost) return `https://${forwardedHost}${path}`
  return `${origin}${path}`
}

/**
 * Create a redirect response that:
 * 1. Carries all Supabase session cookies captured during auth exchange
 * 2. Clears the oauth_signup_intent cookie
 *
 * This is critical — using NextResponse.redirect() alone would drop the session
 * cookies because they were captured in our own array rather than being written
 * to next/headers (which doesn't auto-merge onto a custom NextResponse).
 */
function buildRedirect(
  destination: string,
  sessionCookies: Array<{ name: string; value: string; options: Record<string, unknown> }>,
): NextResponse {
  const response = NextResponse.redirect(destination)

  // Copy Supabase auth session cookies onto the redirect response
  sessionCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  })

  // Clear the signup intent cookie
  response.cookies.set("oauth_signup_intent", "", { maxAge: 0, path: "/" })

  return response
}
