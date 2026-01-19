"use server"

import { createClient } from "./server"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  // Fetch the user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, organization:organizations(*)")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("[v0] Error fetching profile:", profileError)
    return null
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role as "foster" | "rescue",
    orgRole: profile.org_role as "org_admin" | "medical_lead" | "foster_lead" | "adoption_lead" | "staff" | null,
    organizationId: profile.organization_id,
    organization: profile.organization,
    teams: profile.teams || [],
    teamLeads: profile.team_leads || [],
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
