"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/lib/protected-route"
import { createClient } from "@/lib/supabase/client"
import {
  createTeam,
  fetchTeamsForOrg,
  fetchTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateTeam,
  deleteTeam,
  type Team,
  type TeamMember,
  createStaffInvitation,
  fetchPendingStaffInvitations,
  cancelStaffInvitation,
} from "@/lib/team/queries"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  Plus,
  UserPlus,
  Mail,
  MoreVertical,
  Pencil,
  Trash2,
  UserMinus,
  Clock,
  Search,
  Building2,
} from "lucide-react"

type StaffMember = {
  id: string
  name: string
  email: string
  org_role: string
  teams: string[]
  team_leads: string[]
  created_at: string
}

export default function OrgTeamsPage() {
  return (
    <ProtectedRoute allowedRoles={["rescue"]}>
      <OrgTeamsContent />
    </ProtectedRoute>
  )
}

function OrgTeamsContent() {
  const params = useParams()
  const orgId = params.orgId as string
  const supabase = createClient()

  const [teams, setTeams] = useState<Team[]>([])
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({})
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"teams" | "directory">("teams")
  const [searchQuery, setSearchQuery] = useState("")

  // Modals
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showEditTeam, setShowEditTeam] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showInviteStaff, setShowInviteStaff] = useState(false)
  const [showRemoveMember, setShowRemoveMember] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)

  // Create team form
  const [newTeamName, setNewTeamName] = useState("")
  const [newTeamType, setNewTeamType] = useState<"foster" | "medical" | "adoption" | "operations" | "custom">("foster")
  const [newTeamDescription, setNewTeamDescription] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [memberRoles, setMemberRoles] = useState<Record<string, "member" | "lead">>({})

  // Invite staff form
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"staff" | "org_admin">("staff")
  const [inviteTeams, setInviteTeams] = useState<string[]>([])

  // Edit team form
  const [editTeamName, setEditTeamName] = useState("")
  const [editTeamDescription, setEditTeamDescription] = useState("")
  const [editTeamType, setEditTeamType] = useState<Team["type"]>("foster")

  useEffect(() => {
    loadData()
  }, [orgId])

  async function loadData() {
    setIsLoading(true)
    try {
      // Fetch teams with member count
      const teamData = await fetchTeamsForOrg(orgId)
      setTeams(teamData)

      // Fetch members for each team
      const memberData: Record<string, TeamMember[]> = {}
      for (const team of teamData) {
        memberData[team.id] = await fetchTeamMembers(team.id)
      }
      setTeamMembers(memberData)

      // Fetch staff invitations
      const invites = await fetchPendingStaffInvitations(orgId)
      setPendingInvitations(invites)

      // Fetch all staff members in this org
      const { data: staff } = await supabase
        .from("profiles")
        .select("id, name, email, org_role, teams, team_leads, created_at")
        .eq("organization_id", orgId)
        .eq("role", "rescue")
        .order("name")

      setStaffMembers(staff || [])
    } catch (error) {
      console.error("[v0] Error loading teams data:", error)
    }
    setIsLoading(false)
  }

  async function handleCreateTeam() {
    if (!newTeamName.trim()) return

    try {
      const team = await createTeam(orgId, newTeamName, newTeamType, newTeamDescription || undefined)

      // Add selected members
      for (const memberId of selectedMembers) {
        await addTeamMember(team.id, memberId, memberRoles[memberId] || "member")
      }

      // Reset form
      setNewTeamName("")
      setNewTeamType("foster")
      setNewTeamDescription("")
      setSelectedMembers([])
      setMemberRoles({})
      setShowCreateTeam(false)
      loadData()
    } catch (error) {
      console.error("[v0] Error creating team:", error)
      alert("Failed to create team. Please try again.")
    }
  }

  async function handleEditTeam() {
    if (!selectedTeam || !editTeamName.trim()) return

    try {
      await updateTeam(selectedTeam.id, {
        name: editTeamName,
        description: editTeamDescription || undefined,
        type: editTeamType,
      })

      setShowEditTeam(false)
      setSelectedTeam(null)
      loadData()
    } catch (error) {
      console.error("[v0] Error updating team:", error)
      alert("Failed to update team. Please try again.")
    }
  }

  async function handleArchiveTeam(teamId: string) {
    if (!confirm("Are you sure you want to archive this team? This will remove all members from the team.")) return

    try {
      await deleteTeam(teamId)
      loadData()
    } catch (error) {
      console.error("[v0] Error archiving team:", error)
      alert("Failed to archive team. Please try again.")
    }
  }

  async function handleAddMember(userId: string, role: "member" | "lead") {
    if (!selectedTeam) return

    try {
      await addTeamMember(selectedTeam.id, userId, role)
      setShowAddMember(false)
      setSelectedTeam(null)
      loadData()
    } catch (error) {
      console.error("[v0] Error adding member:", error)
      alert("Failed to add member. Please try again.")
    }
  }

  async function handleRemoveMember() {
    if (!selectedTeam || !selectedMember) return

    try {
      await removeTeamMember(selectedTeam.id, selectedMember.user_id)
      setShowRemoveMember(false)
      setSelectedTeam(null)
      setSelectedMember(null)
      loadData()
    } catch (error) {
      console.error("[v0] Error removing member:", error)
      alert("Failed to remove member. Please try again.")
    }
  }

  async function handleInviteStaff() {
    if (!inviteEmail.trim()) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      await createStaffInvitation(orgId, inviteEmail, user.id, inviteRole, inviteTeams)

      setInviteEmail("")
      setInviteRole("staff")
      setInviteTeams([])
      setShowInviteStaff(false)
      loadData()
    } catch (error: any) {
      console.error("[v0] Error inviting staff:", error)
      alert(error.message || "Failed to send invitation. Please try again.")
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    if (!confirm("Cancel this invitation?")) return

    try {
      await cancelStaffInvitation(invitationId)
      loadData()
    } catch (error) {
      console.error("[v0] Error cancelling invitation:", error)
    }
  }

  function openEditTeam(team: Team) {
    setSelectedTeam(team)
    setEditTeamName(team.name)
    setEditTeamDescription(team.description || "")
    setEditTeamType(team.type)
    setShowEditTeam(true)
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case "org_admin":
        return "bg-[#D76B1A] text-white"
      case "lead":
        return "bg-[#5A4A42] text-white"
      case "staff":
        return "bg-[#E8EFE6] text-[#5A4A42]"
      default:
        return "bg-[#F7E2BD] text-[#5A4A42]"
    }
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case "org_admin":
        return "Admin"
      case "lead":
        return "Coordinator"
      case "staff":
        return "Staff"
      case "member":
        return "Member"
      default:
        return "Member"
    }
  }

  function getTeamIcon(type: string) {
    switch (type) {
      case "foster":
        return "🏠"
      case "medical":
        return "⚕️"
      case "adoption":
        return "❤️"
      case "operations":
        return "⚙️"
      default:
        return "👥"
    }
  }

  // Filter staff for search
  const filteredStaff = staffMembers.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Get staff not in selected team for add member modal
  const availableStaff = staffMembers.filter(
    (s) => !teamMembers[selectedTeam?.id || ""]?.some((m) => m.user_id === s.id),
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#5A4A42] mb-1">Teams</h1>
          <p className="text-sm text-[#2E2E2E]/70">Organize your rescue staff and manage team responsibilities</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowInviteStaff(true)}
            variant="outline"
            className="flex items-center gap-2 border-[#D76B1A] text-[#D76B1A] hover:bg-[#D76B1A]/5"
          >
            <Mail className="w-4 h-4" />
            Invite Staff
          </Button>
          <Button
            onClick={() => setShowCreateTeam(true)}
            className="flex items-center gap-2 bg-[#D76B1A] text-white hover:bg-[#D76B1A]/90"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-[#FBF8F4] p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("teams")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "teams" ? "bg-white text-[#5A4A42] shadow-sm" : "text-[#2E2E2E]/60 hover:text-[#5A4A42]"
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Teams ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab("directory")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "directory" ? "bg-white text-[#5A4A42] shadow-sm" : "text-[#2E2E2E]/60 hover:text-[#5A4A42]"
          }`}
        >
          <Building2 className="w-4 h-4 inline mr-2" />
          Staff Directory ({staffMembers.length})
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <p className="text-[#2E2E2E]/60 text-sm">Loading...</p>
        </div>
      ) : activeTab === "teams" ? (
        /* Teams Grid */
        teams.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-[#F7E2BD] rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-[#5A4A42]" />
            </div>
            <h3 className="text-lg font-semibold text-[#5A4A42] mb-2">No teams yet</h3>
            <p className="text-sm text-[#2E2E2E]/60 mb-6 max-w-sm mx-auto">
              Create your first team to organize staff members and assign responsibilities.
            </p>
            <Button onClick={() => setShowCreateTeam(true)} className="bg-[#D76B1A] text-white hover:bg-[#D76B1A]/90">
              <Plus className="w-4 h-4 mr-2" />
              Create your first team
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => {
              const members = teamMembers[team.id] || []
              const leads = members.filter((m) => m.role === "lead")
              const regularMembers = members.filter((m) => m.role !== "lead")

              return (
                <div key={team.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                  {/* Team Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#F7E2BD] flex items-center justify-center text-2xl flex-shrink-0">
                        {getTeamIcon(team.type)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-[#5A4A42] truncate">{team.name}</h3>
                        <p className="text-xs text-[#2E2E2E]/60 capitalize">{team.type} Team</p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditTeam(team)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit Team
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTeam(team)
                            setShowAddMember(true)
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Members
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleArchiveTeam(team.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Archive Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Team Description */}
                  {team.description && (
                    <p className="text-sm text-[#2E2E2E]/70 mb-4 line-clamp-2">{team.description}</p>
                  )}

                  {/* Role Summary */}
                  <div className="flex items-center gap-2 mb-4 text-xs">
                    {leads.length > 0 && (
                      <span className="px-2 py-1 rounded-full bg-[#5A4A42] text-white">
                        {leads.length} Coordinator{leads.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {regularMembers.length > 0 && (
                      <span className="px-2 py-1 rounded-full bg-[#E8EFE6] text-[#5A4A42]">
                        {regularMembers.length} Member{regularMembers.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {members.length === 0 && (
                      <span className="px-2 py-1 rounded-full bg-[#FBF8F4] text-[#2E2E2E]/60">No members</span>
                    )}
                  </div>

                  {/* Member Avatars */}
                  {members.length > 0 ? (
                    <div className="flex items-center gap-1 mb-4">
                      {members.slice(0, 6).map((member, idx) => (
                        <div
                          key={member.id}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white ${
                            member.role === "lead" ? "bg-[#5A4A42] text-white" : "bg-[#F7E2BD] text-[#5A4A42]"
                          }`}
                          style={{ marginLeft: idx > 0 ? "-8px" : "0", zIndex: 6 - idx }}
                          title={`${member.profile?.name || "Unknown"} (${getRoleLabel(member.role)})`}
                        >
                          {member.profile?.name?.charAt(0) || "?"}
                        </div>
                      ))}
                      {members.length > 6 && (
                        <div
                          className="w-8 h-8 rounded-full bg-[#FBF8F4] flex items-center justify-center text-xs font-semibold text-[#5A4A42] border-2 border-white"
                          style={{ marginLeft: "-8px" }}
                        >
                          +{members.length - 6}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4 p-3 rounded-lg bg-[#FBF8F4] text-center">
                      <p className="text-xs text-[#2E2E2E]/60">No members assigned yet</p>
                    </div>
                  )}

                  {/* Actions */}
                  <Button
                    onClick={() => {
                      setSelectedTeam(team)
                      setShowAddMember(true)
                    }}
                    variant="outline"
                    className="w-full border-[#D76B1A] text-[#D76B1A] hover:bg-[#D76B1A]/5"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {members.length === 0 ? "Add Members" : "Manage Members"}
                  </Button>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* Staff Directory */
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-[#F7E2BD]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#2E2E2E]/40" />
              <Input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Staff List */}
          <div className="divide-y divide-[#F7E2BD]/50">
            {filteredStaff.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-[#2E2E2E]/60">No staff members found</p>
              </div>
            ) : (
              filteredStaff.map((staff) => {
                const memberTeams = teams.filter((t) => teamMembers[t.id]?.some((m) => m.user_id === staff.id))

                return (
                  <div key={staff.id} className="p-4 hover:bg-[#FBF8F4] transition flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F7E2BD] flex items-center justify-center text-sm font-semibold text-[#5A4A42] flex-shrink-0">
                      {staff.name?.charAt(0) || staff.email?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-[#5A4A42] truncate">{staff.name || "Unnamed"}</p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(staff.org_role)}`}
                        >
                          {getRoleLabel(staff.org_role)}
                        </span>
                      </div>
                      <p className="text-xs text-[#2E2E2E]/60 truncate">{staff.email}</p>
                      {memberTeams.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {memberTeams.slice(0, 3).map((t) => (
                            <span key={t.id} className="text-xs px-2 py-0.5 rounded-full bg-[#E8EFE6] text-[#5A4A42]">
                              {t.name}
                            </span>
                          ))}
                          {memberTeams.length > 3 && (
                            <span className="text-xs text-[#2E2E2E]/60">+{memberTeams.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-xs text-[#2E2E2E]/40">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Joined {new Date(staff.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="border-t border-[#F7E2BD] p-4 bg-[#FBF8F4]">
              <h4 className="text-sm font-semibold text-[#5A4A42] mb-3">
                <Mail className="w-4 h-4 inline mr-2" />
                Pending Invitations ({pendingInvitations.length})
              </h4>
              <div className="space-y-2">
                {pendingInvitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-[#5A4A42]">{inv.email}</p>
                      <p className="text-xs text-[#2E2E2E]/60">
                        Invited {new Date(inv.created_at).toLocaleDateString()} · {getRoleLabel(inv.org_role)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvitation(inv.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#5A4A42]">Create New Team</DialogTitle>
            <DialogDescription>Set up a new team for your rescue organization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-medium text-[#5A4A42]">Team Name *</Label>
              <Input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Foster Coordinators"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#5A4A42]">Description</Label>
              <Textarea
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                placeholder="What does this team handle?"
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#5A4A42]">Team Type</Label>
              <Select value={newTeamType} onValueChange={(v: any) => setNewTeamType(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="foster">🏠 Foster Team</SelectItem>
                  <SelectItem value="medical">⚕️ Medical Team</SelectItem>
                  <SelectItem value="adoption">❤️ Adoption Team</SelectItem>
                  <SelectItem value="operations">⚙️ Operations Team</SelectItem>
                  <SelectItem value="custom">👥 Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {staffMembers.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-[#5A4A42]">Add Members (Optional)</Label>
                <div className="mt-2 max-h-40 overflow-y-auto border border-[#F7E2BD] rounded-lg divide-y divide-[#F7E2BD]/50">
                  {staffMembers.map((staff) => (
                    <label key={staff.id} className="flex items-center gap-3 p-2 hover:bg-[#FBF8F4] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(staff.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, staff.id])
                          } else {
                            setSelectedMembers(selectedMembers.filter((id) => id !== staff.id))
                          }
                        }}
                        className="rounded border-[#F7E2BD] text-[#D76B1A] focus:ring-[#D76B1A]"
                      />
                      <span className="text-sm text-[#5A4A42]">{staff.name || staff.email}</span>
                      {selectedMembers.includes(staff.id) && (
                        <Select
                          value={memberRoles[staff.id] || "member"}
                          onValueChange={(v: any) => setMemberRoles({ ...memberRoles, [staff.id]: v })}
                        >
                          <SelectTrigger className="h-7 w-28 ml-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="lead">Coordinator</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowCreateTeam(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTeam}
                disabled={!newTeamName.trim()}
                className="bg-[#D76B1A] text-white hover:bg-[#D76B1A]/90"
              >
                Create Team
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={showEditTeam} onOpenChange={setShowEditTeam}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#5A4A42]">Edit Team</DialogTitle>
            <DialogDescription>Update team details for {selectedTeam?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-medium text-[#5A4A42]">Team Name *</Label>
              <Input
                type="text"
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#5A4A42]">Description</Label>
              <Textarea
                value={editTeamDescription}
                onChange={(e) => setEditTeamDescription(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#5A4A42]">Team Type</Label>
              <Select value={editTeamType} onValueChange={(v: any) => setEditTeamType(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="foster">🏠 Foster Team</SelectItem>
                  <SelectItem value="medical">⚕️ Medical Team</SelectItem>
                  <SelectItem value="adoption">❤️ Adoption Team</SelectItem>
                  <SelectItem value="operations">⚙️ Operations Team</SelectItem>
                  <SelectItem value="custom">👥 Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowEditTeam(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditTeam}
                disabled={!editTeamName.trim()}
                className="bg-[#D76B1A] text-white hover:bg-[#D76B1A]/90"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#5A4A42]">Manage Members</DialogTitle>
            <DialogDescription>Add or remove members from {selectedTeam?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Current Members */}
            {selectedTeam && teamMembers[selectedTeam.id]?.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-[#5A4A42]">Current Members</Label>
                <div className="mt-2 border border-[#F7E2BD] rounded-lg divide-y divide-[#F7E2BD]/50">
                  {teamMembers[selectedTeam.id].map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#F7E2BD] flex items-center justify-center text-xs font-semibold text-[#5A4A42]">
                          {member.profile?.name?.charAt(0) || "?"}
                        </div>
                        <span className="text-sm text-[#5A4A42]">{member.profile?.name || "Unknown"}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getRoleBadgeColor(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMember(member)
                          setShowRemoveMember(true)
                        }}
                        className="text-red-600 hover:text-red-700 h-7"
                      >
                        <UserMinus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Members */}
            {availableStaff.length > 0 ? (
              <div>
                <Label className="text-sm font-medium text-[#5A4A42]">Add Staff</Label>
                <div className="mt-2 max-h-48 overflow-y-auto border border-[#F7E2BD] rounded-lg divide-y divide-[#F7E2BD]/50">
                  {availableStaff.map((staff) => (
                    <div key={staff.id} className="flex items-center justify-between p-2 hover:bg-[#FBF8F4]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#F7E2BD] flex items-center justify-center text-xs font-semibold text-[#5A4A42]">
                          {staff.name?.charAt(0) || "?"}
                        </div>
                        <span className="text-sm text-[#5A4A42]">{staff.name || staff.email}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddMember(staff.id, "member")}
                          className="h-7 text-xs"
                        >
                          Add as Member
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAddMember(staff.id, "lead")}
                          className="h-7 text-xs bg-[#5A4A42] text-white hover:bg-[#5A4A42]/90"
                        >
                          Add as Lead
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#FBF8F4] rounded-lg text-center">
                <p className="text-sm text-[#2E2E2E]/60">All staff members are already in this team.</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setShowAddMember(false)
                    setShowInviteStaff(true)
                  }}
                  className="text-[#D76B1A]"
                >
                  Invite new staff
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <Dialog open={showRemoveMember} onOpenChange={setShowRemoveMember}>
        <DialogContent className="bg-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#5A4A42]">Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMember?.profile?.name} from {selectedTeam?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowRemoveMember(false)}>
              Cancel
            </Button>
            <Button onClick={handleRemoveMember} className="bg-red-600 text-white hover:bg-red-700">
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Staff Dialog */}
      <Dialog open={showInviteStaff} onOpenChange={setShowInviteStaff}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#5A4A42]">Invite Staff Member</DialogTitle>
            <DialogDescription>Send an invitation to join your rescue organization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-medium text-[#5A4A42]">Email Address *</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@email.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#5A4A42]">Role</Label>
              <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff Member</SelectItem>
                  <SelectItem value="org_admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[#2E2E2E]/60 mt-1">
                Administrators can manage teams, staff, and organization settings.
              </p>
            </div>
            {teams.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-[#5A4A42]">Assign to Teams (Optional)</Label>
                <div className="mt-2 space-y-2">
                  {teams.map((team) => (
                    <label key={team.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inviteTeams.includes(team.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setInviteTeams([...inviteTeams, team.id])
                          } else {
                            setInviteTeams(inviteTeams.filter((id) => id !== team.id))
                          }
                        }}
                        className="rounded border-[#F7E2BD] text-[#D76B1A] focus:ring-[#D76B1A]"
                      />
                      <span className="text-sm text-[#5A4A42]">{team.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowInviteStaff(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleInviteStaff}
                disabled={!inviteEmail.trim()}
                className="bg-[#D76B1A] text-white hover:bg-[#D76B1A]/90"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
