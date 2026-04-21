"use server"

import { createServiceRoleClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

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

  const h = await headers()
  const host = h.get("host") || "www.getsecondtail.com"
  const protocol = host.includes("localhost") ? "http" : "https"
  const origin = `${protocol}://${host}`

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

    // Fire-and-forget welcome email
    fetch(`${origin}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "welcome-rescue", email, orgName, adminName }),
    }).catch(() => {})

    return { redirectTo: `/org/${newOrg.id}/admin/setup-wizard` }
  }

  // ── Foster signup ──
  const { data: invitation } = await svc
    .from("invitations")
    .select("id, organization_id")
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle()

  const fosterName = ((meta.name as string) || email.split("@")[0]).trim()

  const { error: profileError } = await svc
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        name: fosterName,
        role: "foster",
        organization_id: invitation?.organization_id ?? null,
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

  if (invitation) {
    await svc
      .from("invitations")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", invitation.id)
  }

  // Fire-and-forget welcome email
  fetch(`${origin}/api/email/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "welcome-foster", email, name: fosterName }),
  }).catch(() => {})

  return {
    redirectTo: invitation?.organization_id
      ? `/org/${invitation.organization_id}/foster/dashboard`
      : `/foster/dashboard`,
  }
}
