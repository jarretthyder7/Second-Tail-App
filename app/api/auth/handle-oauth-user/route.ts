import { createServiceRoleClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const { user } = await request.json()

  if (!user?.id || !user?.email) {
    return NextResponse.json({ error: "Missing user data" }, { status: 400 })
  }

  const svc = createServiceRoleClient()

  // Read rescue signup intent from the cookie
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
    try {
      signupIntent = JSON.parse(atob(intentCookie.value))
    } catch { /* malformed — ignore */ }
  }

  // Clear the intent cookie
  cookieStore.set("oauth_signup_intent", "", { maxAge: 0, path: "/" })

  const meta = user.user_metadata || {}

  const isRescueSignup =
    (signupIntent?.role === "rescue" && signupIntent?.org_role === "org_admin" && !!signupIntent?.orgName) ||
    (meta.role === "rescue" && meta.org_role === "org_admin" && !!meta.org_name)

  const isFosterGoogleSignup = signupIntent?.role === "foster"

  // Resolve fields
  const rescueOrgName = (signupIntent?.orgName || meta.org_name || "").trim()
  const rescueAdminName = (signupIntent?.adminName || meta.name || user.email?.split("@")[0] || "").trim()
  const rescueCity = (signupIntent?.city || meta.city || "").trim()
  const rescueState = (signupIntent?.state || meta.state || "").trim()

  // Check existing profile
  const { data: existingProfile } = await svc
    .from("profiles")
    .select("id, role, organization_id, name")
    .eq("id", user.id)
    .maybeSingle()

  let finalProfile = existingProfile

  // Handle rescue signup
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
        console.error("handle-oauth-user: org creation failed", orgError.message)
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
      .select("id, role, organization_id, name")
      .single()

    if (upsertError) {
      console.error("handle-oauth-user: rescue profile upsert failed", upsertError.message)
    } else {
      finalProfile = upserted
    }

  // Handle foster signup
  } else if (isFosterGoogleSignup || !existingProfile) {
    const { data: invitation } = await svc
      .from("invitations")
      .select("id, organization_id")
      .eq("email", user.email)
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
      .select("id, role, organization_id, name")
      .single()

    if (upsertError) {
      console.error("handle-oauth-user: foster profile upsert failed", upsertError)
    } else {
      finalProfile = upserted

      if (invitation) {
        await svc.from("invitations")
          .update({ status: "accepted", updated_at: new Date().toISOString() })
          .eq("id", invitation.id)
      }
    }
  }

  // Ensure foster_profiles row exists
  if (finalProfile?.role === "foster") {
    const { data: fp } = await svc
      .from("foster_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

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
      }).catch((e: unknown) => console.error("handle-oauth-user: foster_profiles insert failed", e))
    } else if (si) {
      await svc.from("foster_profiles").update(profileData)
        .eq("user_id", user.id)
        .catch((e: unknown) => console.error("handle-oauth-user: foster_profiles update failed", e))
    }
  }

  // Determine redirect
  let redirectTo = "/"

  if (!finalProfile) {
    redirectTo = isRescueSignup
      ? `/sign-up/rescue?error=setup-incomplete`
      : `/login/foster`
  } else if (finalProfile.role === "rescue") {
    redirectTo = finalProfile.organization_id
      ? `/org/${finalProfile.organization_id}/admin/setup-wizard`
      : `/sign-up/rescue?error=setup-incomplete`
  } else if (finalProfile.role === "foster") {
    redirectTo = finalProfile.organization_id
      ? `/org/${finalProfile.organization_id}/foster/dashboard`
      : `/foster/dashboard`
  }

  return NextResponse.json({ redirectTo })
}
