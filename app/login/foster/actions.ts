import { createClient } from "@/lib/supabase/client"

export async function fosterLogin(email: string, password: string, inviteCode?: string | null) {
  const supabase = createClient()

  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { error: signInError.message }
  }

  if (!data.user) {
    return { error: "Unable to log in. Please try again." }
  }

  // If there's an invite code, accept the invitation and link to the organization
  if (inviteCode) {
    // Find the invitation by code
    const { data: invitation } = await supabase
      .from("invitations")
      .select("id, organization_id, email, status")
      .eq("code", inviteCode)
      .eq("status", "pending")
      .single()

    if (invitation && invitation.email.toLowerCase() === email.toLowerCase()) {
      // Update the user's profile to link to the organization
      await supabase
        .from("profiles")
        .update({ organization_id: invitation.organization_id })
        .eq("id", data.user.id)

      // Mark the invitation as accepted
      await supabase
        .from("invitations")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", invitation.id)

      // Redirect directly to the org's foster dashboard
      return { redirectTo: `/org/${invitation.organization_id}/foster/dashboard` }
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", data.user.id)
    .single()

  if (profileError || !profile) {
    return {
      error: "Unable to load user profile. Please try again.",
    }
  }

  if (profile.role !== "foster") {
    return { error: "This account is not a foster account. Please use Rescue Team Login." }
  }

  const redirectTo = profile.organization_id
    ? `/org/${profile.organization_id}/foster/dashboard`
    : "/foster/dashboard"

  return { redirectTo }
}
