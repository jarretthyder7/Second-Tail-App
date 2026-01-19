import { createClient } from "@/lib/supabase/client"

export type Team = {
  id: string
  organization_id: string
  name: string
  type: "foster" | "medical" | "adoption" | "operations" | "custom"
  description: string | null
  lead_id: string | null
  created_at: string
  updated_at: string
  member_count?: number
  lead?: {
    id: string
    name: string
    email: string
  }
}

export type TeamMember = {
  id: string
  team_id: string
  user_id: string
  role: "member" | "lead"
  joined_at: string
  profile: {
    id: string
    name: string
    email: string
  }
}

export type StaffInvitation = {
  id: string
  organization_id: string
  email: string
  invited_by: string
  org_role: "org_admin" | "staff"
  assigned_teams: string[]
  status: "pending" | "accepted" | "declined" | "cancelled"
  created_at: string
  updated_at: string
}

// Team CRUD Operations
export async function createTeam(
  organizationId: string,
  name: string,
  type: Team["type"],
  description?: string,
  leadId?: string,
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("teams")
    .insert({
      organization_id: organizationId,
      name,
      type,
      description,
      lead_id: leadId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function fetchTeamsForOrg(organizationId: string): Promise<Team[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("teams")
    .select(`
      *,
      team_members(count)
    `)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data || []).map((team: any) => ({
    ...team,
    member_count: team.team_members[0]?.count || 0,
  }))
}

export async function fetchTeamMembers(teamId: string): Promise<TeamMember[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("team_members")
    .select(`
      *,
      profile:profiles(id, name, email)
    `)
    .eq("team_id", teamId)
    .order("joined_at", { ascending: true })

  if (error) throw error
  return data || []
}

export async function addTeamMember(teamId: string, userId: string, role: "member" | "lead" = "member") {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("team_members")
    .insert({
      team_id: teamId,
      user_id: userId,
      role,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeTeamMember(teamId: string, userId: string) {
  const supabase = createClient()

  const { error } = await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", userId)

  if (error) throw error
}

export async function updateTeamMemberRole(teamId: string, userId: string, role: "member" | "lead") {
  const supabase = createClient()

  const { error } = await supabase.from("team_members").update({ role }).eq("team_id", teamId).eq("user_id", userId)

  if (error) throw error
}

export async function updateTeam(
  teamId: string,
  updates: Partial<Pick<Team, "name" | "description" | "lead_id" | "type">>,
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("teams")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", teamId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTeam(teamId: string) {
  const supabase = createClient()

  const { error } = await supabase.from("teams").delete().eq("id", teamId)

  if (error) throw error
}

// Staff Invitation Operations
export async function createStaffInvitation(
  organizationId: string,
  email: string,
  invitedBy: string,
  orgRole: "org_admin" | "staff",
  assignedTeams: string[] = [],
) {
  const supabase = createClient()

  // Check if invitation already exists
  const { data: existing } = await supabase
    .from("staff_invitations")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("email", email)
    .in("status", ["pending", "accepted"])
    .maybeSingle()

  if (existing) {
    if (existing.status === "accepted") {
      throw new Error("This person is already part of your organization")
    }
    throw new Error("An invitation has already been sent to this email")
  }

  const { data, error } = await supabase
    .from("staff_invitations")
    .insert({
      organization_id: organizationId,
      email,
      invited_by: invitedBy,
      org_role: orgRole,
      assigned_teams: assignedTeams,
      status: "pending",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function fetchPendingStaffInvitations(organizationId: string): Promise<StaffInvitation[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("staff_invitations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function fetchStaffInvitationsForEmail(email: string): Promise<StaffInvitation[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("staff_invitations")
    .select("*")
    .eq("email", email)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function acceptStaffInvitation(invitationId: string, userId: string) {
  const supabase = createClient()

  // Get invitation details
  const { data: invitation, error: fetchError } = await supabase
    .from("staff_invitations")
    .select("*")
    .eq("id", invitationId)
    .single()

  if (fetchError) throw fetchError
  if (!invitation) throw new Error("Invitation not found")

  // Update profile with organization and role
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      organization_id: invitation.organization_id,
      org_role: invitation.org_role,
      role: "rescue",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (profileError) throw profileError

  // Add to assigned teams
  if (invitation.assigned_teams && invitation.assigned_teams.length > 0) {
    const teamMembersToInsert = invitation.assigned_teams.map((teamId) => ({
      team_id: teamId,
      user_id: userId,
      role: "member" as const,
    }))

    const { error: teamError } = await supabase.from("team_members").insert(teamMembersToInsert)

    if (teamError) console.error("Error adding to teams:", teamError)
  }

  // Mark invitation as accepted
  const { error: updateError } = await supabase
    .from("staff_invitations")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invitationId)

  if (updateError) throw updateError
}

export async function declineStaffInvitation(invitationId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("staff_invitations")
    .update({
      status: "declined",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invitationId)

  if (error) throw error
}

export async function cancelStaffInvitation(invitationId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("staff_invitations")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invitationId)

  if (error) throw error
}
