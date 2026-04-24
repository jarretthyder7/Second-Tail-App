"use server"

import { createServiceRoleClient } from "@/lib/supabase/server"
import { sendWelcomeEmailFoster, sendWelcomeEmailRescue } from "@/lib/email/send"

/**
 * Runs immediately after a successful supabase.auth.signUp() call from the
 * foster or rescue sign-up pages. Creates the organization (rescue only),
 * the `profiles` row, the `foster_profiles` row (foster only), accepts any
 * pending invitation, and fires off the welcome email.
 *
 * Returns either `{ redirectTo }` on success or `{ error }` on failure.
 *
 * This replaces the profile-creation logic that used to live in
 * /auth/callback/route.ts for email signup. The callback route still runs
 * for password reset and Google OAuth, so we leave it intact.
 */
export async function createProfileAfterSignup(userId: string) {
  const svc = createServiceRoleClient()

  // Look up the newly-created user to get email + metadata from signUp options.data
  const { data: userData, error: userError } = await svc.auth.admin.getUserById(userId)
  if (userError || !userData.user) {
    console.error("createProfileAfterSignup: user lookup failed", userError?.message)
    return { error: "Unable to find your new account. Please try logging in." }
  }

  const user = userData.user
  const meta = (user.user_metadata || {}) as Record<string, unknown>
  const email = user.email!
  const phone = ((meta.phone as string) || "").trim() || null

  const isRescue =
    meta.role === "rescue" &&
    meta.org_role === "org_admin" &&
    typeof meta.org_name === "string" &&
    !!(meta.org_name as string).trim()

  // ── Rescue signup ──
  if (isRescue) {
    const orgName = (meta.org_name as string).trim()
    const adminName = ((meta.name as string) || email.split("@")[0]).trim()

    const { data: newOrg, error: orgError } = await svc
      .from("organizations")
      .insert({
        name: orgName,
        city: (meta.city as string) || null,
        state: (meta.state as string) || null,
      })
      .select("id")
      .single()

    if (orgError || !newOrg) {
      console.error("createProfileAfterSignup: org creation failed", orgError?.message)
      return { error: "Unable to create your organization. Please try again." }
    }

    const { error: profileError } = await svc
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email,
          name: adminName,
          phone,
          role: "rescue",
          org_role: "org_admin",
          organization_id: newOrg.id,
        },
        { onConflict: "id" },
      )

    if (profileError) {
      console.error("createProfileAfterSignup: rescue profile upsert failed", profileError.message)
      return { error: "Unable to create your profile. Please try again." }
    }

    // Fire-and-forget welcome email (call directly — avoids the /api/email/send auth gate)
    sendWelcomeEmailRescue(email, orgName, adminName).catch((err) =>
      console.error("createProfileAfterSignup: welcome-rescue email failed", err),
    )

    return { redirectTo: `/org/${newOrg.id}/admin/setup-wizard` }
  }

  // ── Foster signup ──
  // Only auto-accept an invitation if the foster arrived via an invite link
  // (invite_code in metadata). Matching on email alone silently attached fosters
  // to stale pending invites — bug fixed here.
  const inviteCode = typeof meta.invite_code === "string" ? (meta.invite_code as string) : null
  const { data: invitation } = inviteCode
    ? await svc
        .from("invitations")
        .select("id, organization_id, email")
        .eq("code", inviteCode)
        .eq("status", "pending")
        .maybeSingle()
    : { data: null as { id: string; organization_id: string; email: string } | null }

  // Defense in depth: the invitation's email must match the signing-up user's.
  const validInvitation =
    invitation && invitation.email?.toLowerCase() === email.toLowerCase() ? invitation : null

  const fosterName = ((meta.name as string) || email.split("@")[0]).trim()

  const { error: profileError } = await svc
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        name: fosterName,
        phone,
        role: "foster",
        organization_id: validInvitation?.organization_id ?? null,
      },
      { onConflict: "id" },
    )

  if (profileError) {
    console.error("createProfileAfterSignup: foster profile upsert failed", profileError.message)
    return { error: "Unable to create your profile. Please try again." }
  }

  // Create foster_profiles row if one doesn't already exist (a DB trigger may
  // create it automatically — the maybeSingle check avoids a duplicate insert).
  const { data: existingFp } = await svc
    .from("foster_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!existingFp) {
    const { error: fpError } = await svc.from("foster_profiles").insert({
      user_id: user.id,
      city: (meta.city as string) || "",
      state: (meta.state as string) || "",
      housing_type: (meta.living_situation as string) || "",
      has_yard: !!meta.has_yard,
      has_pets: !!meta.has_pets,
      existing_pets_description: (meta.pets as string) || "",
      preferred_dog_sizes: (meta.dog_sizes as string[]) || [],
      onboarding_completed: false,
    })
    if (fpError) {
      console.error("createProfileAfterSignup: foster_profiles insert failed", fpError.message)
      // Non-fatal — profile still exists, they can complete onboarding later
    }
  }

  if (validInvitation) {
    await svc
      .from("invitations")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", validInvitation.id)
  }

  // Fire-and-forget welcome email (call directly — avoids the /api/email/send auth gate)
  sendWelcomeEmailFoster(email, fosterName).catch((err) =>
    console.error("createProfileAfterSignup: welcome-foster email failed", err),
  )

  return {
    redirectTo: validInvitation?.organization_id
      ? `/org/${validInvitation.organization_id}/foster/dashboard`
      : `/foster/dashboard`,
  }
}
