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
  let signupIntent: {
    role?: string
    org_role?: string
    orgName?: string
    adminName?: string
    // Rescue address fields
    city?: string
    state?: string
    zip?: string
    // Foster Google signup fields
    livingSituation?: string
    pets?: string[]
    fosterCount?: string
    childrenInHome?: string
    dogSizes?: string[]
    fosterDuration?: string
    whyFoster?: string
  } | null = null
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
      // PKCE verifier is missing server-side (stored in browser localStorage by the
      // plain supabase-js client). Forward the code to the client-side callback page
      // where localStorage is accessible and the exchange can succeed.
      // The OAuth code is NOT consumed by a failed client-side PKCE validation.
      return buildRedirect(
        `${buildUrl(origin, request, "/auth/google-callback")}?code=${encodeURIComponent(code)}`,
        sessionCookies
      )
    }
    console.log("[v0] Auth callback: Successfully exchanged code for session, user:", data.user.email)
    user = data.user
  } else if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "signup" | "recovery" | "invite" | "email_change" | "phone_change",
    })
    if (error || !data.user) {
      console.error("Auth callback: OTP verification failed —", error?.message)
      const msg = encodeURIComponent(error?.message || "OTP verification failed")
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=otp_failed&error_description=${msg}`)
    }
    user = data.user

    // For email signup confirmations, redirect to the account confirmed page
    // instead of trying to auto-login (which requires session cookies from the original browser)
    if (type === "signup") {
      const userRole = user.user_metadata?.role || "foster"
      return NextResponse.redirect(
        buildUrl(origin, request, `/auth/account-confirmed?type=${userRole}`)
      )
    }
  } else {
    console.error("Auth callback: no code or token_hash in request", { searchParams: Object.fromEntries(searchParams) })
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code&error_description=No+auth+code+received`)
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

  // user_metadata holds data from email signup options.data
  const meta = user.user_metadata || {}

  // Support both Google OAuth (intent cookie) and email signup (user_metadata) for rescue
  const isRescueSignup =
    (signupIntent?.role === "rescue" && signupIntent?.org_role === "org_admin" && !!signupIntent?.orgName) ||
    (meta.role === "rescue" && meta.org_role === "org_admin" && !!meta.org_name)

  const isFosterGoogleSignup = signupIntent?.role === "foster"

  // Resolve rescue org fields — prefer intent cookie (Google), fall back to metadata (email)
  const rescueOrgName = (signupIntent?.orgName || (meta.org_name as string) || "").trim()
  const rescueAdminName = (signupIntent?.adminName || (meta.name as string) || user.email?.split("@")[0] || "").trim()
  const rescueCity = (signupIntent?.city || (meta.city as string) || "").trim()
  const rescueState = (signupIntent?.state || (meta.state as string) || "").trim()

  let finalProfile = existingProfile

  // ── Step 2: Handle rescue signup (Google or email) ──
  if (isRescueSignup) {
    let orgId = existingProfile?.organization_id ?? null

    if (!orgId) {
      const { data: newOrg, error: orgError } = await svc
        .from("organizations")
        .insert({
          name: rescueOrgName,
          city: rescueCity || null,
          state: rescueState || null,
        })
        .select("id")
        .single()

      if (orgError) {
        console.error("Auth callback: org creation failed", orgError.message, orgError.details)
      } else {
        orgId = newOrg.id
      }
    }

    const { data: upserted, error: upsertError } = await svc
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        name: rescueAdminName,
        role: "rescue",
        org_role: "org_admin",
        organization_id: orgId,
      }, { onConflict: "id" })
      .select("id, role, organization_id, name, phone, city, state, experience_level, dog_size_preference, availability")
      .single()

    if (upsertError) {
      console.error("Auth callback: rescue profile upsert failed", upsertError.message)
    } else {
      finalProfile = upserted
      fetch(`${origin}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "welcome-rescue", email: user.email, orgName: rescueOrgName, adminName: rescueAdminName }),
      }).catch(() => {})
    }

  // ── Step 3: Handle foster signup — either Google (with intent) or no profile yet ──
  } else if (isFosterGoogleSignup || !existingProfile) {
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

    // Build profile data — prefer intent (Google signup with form answers) over meta (email signup)
    const si = isFosterGoogleSignup ? signupIntent : null
    const profileData = {
      housing_type: si?.livingSituation || meta.living_situation || "",
      has_yard: si?.livingSituation
        ? si.livingSituation.toLowerCase().includes("yard")
        : (meta.has_yard || false),
      has_pets: si?.pets
        ? Array.isArray(si.pets) && si.pets.length > 0 && !si.pets.includes("None")
        : (meta.has_pets || false),
      existing_pets_description: si?.pets
        ? (Array.isArray(si.pets) ? si.pets.join(", ") : "")
        : (meta.pets || ""),
      preferred_dog_sizes: si?.dogSizes || meta.dog_sizes || [],
    }

    if (!fp) {
      await svc.from("foster_profiles").insert({
        user_id: user.id,
        city: meta.city || "",
        state: meta.state || "",
        ...profileData,
        onboarding_completed: false,
      }).catch((e: unknown) => console.error("Auth callback: foster_profiles insert failed", e))
    } else if (si) {
      // Google signup with form answers — update the row the trigger already created
      await svc.from("foster_profiles").update(profileData)
        .eq("user_id", user.id)
        .catch((e: unknown) => console.error("Auth callback: foster_profiles update failed", e))
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
    const fallback = isRescueSignup
      ? `/sign-up/rescue?error=setup-incomplete`
      : existingProfile?.role === "rescue"
        ? `/login/rescue`
        : `/login/foster`
    return buildRedirect(buildUrl(origin, request, fallback), sessionCookies, cookieStore)
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

  return buildRedirect(buildUrl(origin, request, redirectPath), sessionCookies, cookieStore)
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
 * Create a redirect response that carries the Supabase session cookies.
 *
 * Belt-and-suspenders approach: write cookies via BOTH the next/headers
 * cookie store AND directly onto the NextResponse. This covers both the
 * case where Next.js auto-merges cookie store cookies into any response,
 * and the case where it doesn't (which varies by Next.js/Vercel version).
 */
function buildRedirect(
  destination: string,
  sessionCookies: Array<{ name: string; value: string; options: Record<string, unknown> }>,
  cookieStore?: Awaited<ReturnType<typeof import("next/headers")["cookies"]>>,
): NextResponse {
  const isProd = process.env.NODE_ENV === "production"
  const response = NextResponse.redirect(destination)

  sessionCookies.forEach(({ name, value, options }) => {
    const cookieOptions = {
      ...(options as object),
      httpOnly: true,
      secure: isProd,
      sameSite: "lax" as const,
      path: "/",
    } as Parameters<typeof response.cookies.set>[2]

    // Write to the redirect response directly
    response.cookies.set(name, value, cookieOptions)

    // Also write via next/headers cookie store as a fallback
    try { cookieStore?.set(name, value, cookieOptions) } catch {}
  })

  // Clear the signup intent cookie
  response.cookies.set("oauth_signup_intent", "", { maxAge: 0, path: "/" })
  try { cookieStore?.set("oauth_signup_intent", "", { maxAge: 0, path: "/" }) } catch {}

  return response
}
