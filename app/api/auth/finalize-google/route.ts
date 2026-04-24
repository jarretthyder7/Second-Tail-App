import { createServerClient } from "@supabase/ssr"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"
import { cookies } from "next/headers"

// Called after the browser has exchanged the OAuth code for a session
// (client-side, in /auth/google-callback). At this point the session cookies
// are already set in the browser, so the server can read the current user.
// This route handles profile/org creation and returns the correct redirect path.
export async function POST(request: NextRequest) {
  const { origin } = new URL(request.url)
  const cookieStore = await cookies()

  // Read signup intent stored before OAuth was initiated
  const intentCookie = cookieStore.get("oauth_signup_intent")
  let signupIntent: {
    role?: string
    org_role?: string
    orgName?: string
    adminName?: string
    city?: string
    state?: string
    zip?: string
    livingSituation?: string
    pets?: string[]
    fosterCount?: string
    childrenInHome?: string
    dogSizes?: string[]
    fosterDuration?: string
    whyFoster?: string
  } | null = null
  if (intentCookie?.value) {
    try { signupIntent = JSON.parse(atob(intentCookie.value)) } catch { /* malformed */ }
  }

  // Standard server client — reads session from the cookies the browser just set
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ redirectTo: "/login/foster" })
  }

  const svc = createServiceRoleClient()
  const meta = user.user_metadata || {}

  const isRescueSignup =
    (signupIntent?.role === "rescue" && signupIntent?.org_role === "org_admin" && !!signupIntent?.orgName) ||
    (meta.role === "rescue" && meta.org_role === "org_admin" && !!meta.org_name)

  const isFosterGoogleSignup = signupIntent?.role === "foster"

  const rescueOrgName = (signupIntent?.orgName || (meta.org_name as string) || "").trim()
  const rescueAdminName = (signupIntent?.adminName || (meta.name as string) || user.email?.split("@")[0] || "").trim()
  const rescueCity = (signupIntent?.city || (meta.city as string) || "").trim()
  const rescueState = (signupIntent?.state || (meta.state as string) || "").trim()

  const { data: existingProfile } = await svc
    .from("profiles")
    .select("id, role, organization_id, name, phone, city, state, experience_level, dog_size_preference, availability")
    .eq("id", user.id)
    .maybeSingle()

  let finalProfile = existingProfile

  if (isRescueSignup) {
    let orgId = existingProfile?.organization_id ?? null
    if (!orgId) {
      const { data: newOrg } = await svc
        .from("organizations")
        .insert({ name: rescueOrgName, city: rescueCity || null, state: rescueState || null })
        .select("id")
        .single()
      if (newOrg) orgId = newOrg.id
    }
    const { data: upserted } = await svc
      .from("profiles")
      .upsert(
        { id: user.id, email: user.email, name: rescueAdminName, role: "rescue", org_role: "org_admin", organization_id: orgId },
        { onConflict: "id" }
      )
      .select("id, role, organization_id, name, phone, city, state, experience_level, dog_size_preference, availability")
      .single()
    if (upserted) {
      finalProfile = upserted
      fetch(`${origin}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "welcome-rescue", email: user.email, orgName: rescueOrgName, adminName: rescueAdminName }),
      }).catch(() => {})
    }
  } else if (isFosterGoogleSignup || !existingProfile) {
    // Only auto-accept an invitation if the foster arrived via an invite link
    // (invite_code in metadata). Email-only matching silently attached fosters
    // to stale invites; fixed here.
    const inviteCode =
      (typeof meta.invite_code === "string" && meta.invite_code) ||
      (signupIntent as { invite_code?: string } | null)?.invite_code ||
      null

    const { data: invitation } = inviteCode
      ? await svc
          .from("invitations")
          .select("id, organization_id, email")
          .eq("code", inviteCode)
          .eq("status", "pending")
          .maybeSingle()
      : { data: null as { id: string; organization_id: string; email: string } | null }

    const validInvitation =
      invitation && invitation.email?.toLowerCase() === user.email?.toLowerCase()
        ? invitation
        : null

    const { data: upserted } = await svc
      .from("profiles")
      .upsert(
        { id: user.id, email: user.email, name: meta.name || user.email?.split("@")[0], role: "foster", organization_id: validInvitation?.organization_id ?? null },
        { onConflict: "id" }
      )
      .select("id, role, organization_id, name, phone, city, state, experience_level, dog_size_preference, availability")
      .single()
    if (upserted) {
      finalProfile = upserted
      fetch(`${origin}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "welcome-foster", email: user.email, name: meta.name || user.email?.split("@")[0] }),
      }).catch(() => {})
      if (validInvitation) {
        await svc.from("invitations").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", validInvitation.id)
      }
    }
  }

  if (finalProfile?.role === "foster") {
    const { data: fp } = await svc.from("foster_profiles").select("id").eq("user_id", user.id).maybeSingle()
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
        user_id: user.id, city: meta.city || "", state: meta.state || "", ...profileData, onboarding_completed: false,
      }).catch(() => {})
    } else if (si) {
      await svc.from("foster_profiles").update(profileData).eq("user_id", user.id).catch(() => {})
    }
  }

  // Clear intent cookie
  cookieStore.set("oauth_signup_intent", "", { maxAge: 0, path: "/" })

  let redirectTo = "/"
  if (!finalProfile) {
    redirectTo = isRescueSignup ? "/sign-up/rescue?error=setup-incomplete" : "/login/foster"
  } else if (finalProfile.role === "rescue") {
    redirectTo = finalProfile.organization_id
      ? `/org/${finalProfile.organization_id}/admin/setup-wizard`
      : "/sign-up/rescue?error=setup-incomplete"
  } else if (finalProfile.role === "foster") {
    redirectTo = finalProfile.organization_id
      ? `/org/${finalProfile.organization_id}/foster/dashboard`
      : "/foster/dashboard"
  }

  return NextResponse.json({ redirectTo })
}
