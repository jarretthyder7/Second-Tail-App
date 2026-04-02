"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ProtectedRoute } from "@/lib/protected-route"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { MessageSquare, Plus, MoreVertical, UserPlus, Users } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

export default function OrgMessagesPage() {
  const params = useParams()
  const orgId = params.orgId as string

  const [open, setOpen] = useState(false)
  const [selectedFoster, setSelectedFoster] = useState<string>("")
  const [selectedDog, setSelectedDog] = useState<string>("")
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [messageContent, setMessageContent] = useState("")
  const [fosters, setFosters] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [availableDogs, setAvailableDogs] = useState<any[]>([])
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assigningConversation, setAssigningConversation] = useState<string | null>(null)
  const [assignTeamValue, setAssignTeamValue] = useState<string>("")
  const [assignRecipient, setAssignRecipient] = useState<string>("")
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false)
  const [selectedConversationForStaff, setSelectedConversationForStaff] = useState<string | null>(null)
  const [selectedStaffMembers, setSelectedStaffMembers] = useState<string[]>([])
  const [availableStaff, setAvailableStaff] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [conversationStaff, setConversationStaff] = useState<Map<string, Array<{ id: string; name: string }>>>(
    new Map(),
  )

  const supabase = createClient()

  useEffect(() => {
    loadData()
    loadAvailableStaff()
  }, [orgId])

  async function loadData() {
    try {
      console.log("[v0] Loading data for orgId:", orgId)

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      console.log("[v0] Auth user:", authUser?.id)
      if (!authUser) {
        console.log("[v0] No authenticated user")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()
      console.log("[v0] User profile:", profile)
      setUser(profile)

      // Get all dogs in this organization
      const { data: orgDogs } = await supabase
        .from("dogs")
        .select("foster_id")
        .eq("organization_id", orgId)
        .not("foster_id", "is", null)

      // Get unique foster IDs from the dogs
      const fosterIds = [...new Set(orgDogs?.map((d) => d.foster_id).filter(Boolean) || [])]

      console.log("[v0] Foster IDs from dogs:", fosterIds)

      // Fetch foster profiles - either directly assigned to org OR connected via dogs
      let fosterProfiles = []
      if (fosterIds.length > 0) {
        const { data, error: fostersError } = await supabase
          .from("profiles")
          .select("id, name, email")
          .or(`organization_id.eq.${orgId},id.in.(${fosterIds.join(",")})`)
          .eq("role", "foster")

        console.log("[v0] Fosters query result:", { data, fostersError, count: data?.length })
        fosterProfiles = data || []
      } else {
        // Fallback to just checking organization_id if no dogs are assigned
        const { data, error: fostersError } = await supabase
          .from("profiles")
          .select("id, name, email")
          .eq("organization_id", orgId)
          .eq("role", "foster")

        console.log("[v0] Fosters query result (fallback):", { data, fostersError, count: data?.length })
        fosterProfiles = data || []
      }

      setFosters(fosterProfiles || [])

      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .eq("organization_id", orgId)

      console.log("[v0] Teams query result:", { teamsData, teamsError, count: teamsData?.length })
      setTeams(teamsData || [])

      const { data: convs, error: convsError } = await supabase
        .from("conversations")
        .select(`
          id,
          created_at,
          updated_at,
          organization_id,
          dog_id,
          team,
          recipient_id,
          dogs!conversations_dog_id_fkey (
            id,
            name,
            foster_id,
            foster:foster_id (
              id,
              name,
              email
            )
          )
        `)
        .eq("organization_id", orgId)
        .order("updated_at", { ascending: false })

      console.log("[v0] Conversations query result:", { convs, convsError, count: convs?.length })

      const transformedConvs =
        convs?.map((conv) => ({
          ...conv,
          dog: conv.dogs,
          foster: conv.dogs?.foster || { name: "Unknown Foster", email: "" },
        })) || []

      setConversations(transformedConvs)
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedFoster) {
      supabase
        .from("dogs")
        .select("*")
        .eq("foster_id", selectedFoster)
        .eq("organization_id", orgId)
        .then(({ data }) => setAvailableDogs(data || []))
    } else {
      setAvailableDogs([])
    }
  }, [selectedFoster, orgId])

  useEffect(() => {
    if (assignTeamValue) {
      supabase
        .from("profiles")
        .select("id, name, email")
        .eq("organization_id", orgId)
        .contains("teams", [assignTeamValue])
        .then(({ data }) => setTeamMembers(data || []))
    } else {
      setTeamMembers([])
    }
  }, [assignTeamValue, orgId])

  async function loadAvailableStaff() {
    try {
      const { data: staff } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("organization_id", orgId)
        .eq("role", "rescue")
        .order("name")

      if (staff) {
        setAvailableStaff(staff)
      }
    } catch (error) {
      console.error("Error loading staff:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedFoster || !messageContent.trim() || !user) return

    try {
      console.log("[v0] Sending message:", { selectedFoster, selectedDog, selectedTeam, messageContent })

      let conversationId = null

      if (selectedDog) {
        const { data: existingConv } = await supabase
          .from("conversations")
          .select("*")
          .eq("organization_id", orgId)
          .eq("dog_id", selectedDog)
          .maybeSingle()

        conversationId = existingConv?.id
      }

      if (!conversationId) {
        const conversationData: any = {
          organization_id: orgId,
          dog_id: selectedDog || null,
        }

        if (selectedTeam) {
          const team = teams.find((t) => t.id === selectedTeam)
          conversationData.team = team?.name
        }

        console.log("[v0] Creating conversation with data:", conversationData)

        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert(conversationData)
          .select()
          .single()

        if (convError) {
          console.error("[v0] Error creating conversation:", convError)
          throw convError
        }

        console.log("[v0] Created conversation:", newConv)
        conversationId = newConv.id
      }

      const { error: msgError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: messageContent,
      })

      if (msgError) {
        console.error("[v0] Error creating message:", msgError)
        throw msgError
      }

      console.log("[v0] Message sent successfully")

      // Reset form
      setSelectedFoster("")
      setSelectedDog("")
      setSelectedTeam("")
      setMessageContent("")
      setOpen(false)

      // Refresh conversations
      await loadData()
    } catch (error) {
      console.error("[v0] Failed to send message:", error)
      alert("Failed to send message. Please try again.")
    }
  }

  const handleOpenAssignDialog = (conversationId: string, currentTeam?: string) => {
    setAssigningConversation(conversationId)
    setAssignTeamValue(currentTeam || "")
    setAssignRecipient("")
    setAssignDialogOpen(true)
  }

  const handleAssignTeam = async () => {
    if (!assigningConversation) return

    try {
      const updateData: any = {}

      if (assignTeamValue) {
        const team = teams.find((t) => t.id === assignTeamValue)
        updateData.team = team?.name
      } else {
        updateData.team = null
      }

      if (assignRecipient) {
        updateData.recipient_id = assignRecipient
      }

      const { error } = await supabase.from("conversations").update(updateData).eq("id", assigningConversation)

      if (error) throw error

      setAssignDialogOpen(false)
      setAssigningConversation(null)
      setAssignTeamValue("")
      setAssignRecipient("")

      // Refresh conversations
      await loadData()
    } catch (error) {
      console.error("[v0] Failed to assign team:", error)
      alert("Failed to assign team. Please try again.")
    }
  }

  async function handleAddStaffToConversation() {
    if (!selectedConversationForStaff || selectedStaffMembers.length === 0) return

    try {
      // Store staff IDs in the conversation's team field as a JSON array
      const { data: conv } = await supabase
        .from("conversations")
        .select("team")
        .eq("id", selectedConversationForStaff)
        .single()

      let currentTeam: string[] = []
      if (conv?.team) {
        try {
          const parsed = JSON.parse(conv.team)
          currentTeam = Array.isArray(parsed) ? parsed : []
        } catch {
          currentTeam = []
        }
      }
      const newTeam = [...new Set([...currentTeam, ...selectedStaffMembers])]

      await supabase
        .from("conversations")
        .update({ team: JSON.stringify(newTeam) })
        .eq("id", selectedConversationForStaff)

      // Reload conversations
      await loadData()
      setShowAddStaffDialog(false)
      setSelectedConversationForStaff(null)
      setSelectedStaffMembers([])
    } catch (error) {
      console.error("Error adding staff to conversation:", error)
      alert("Failed to add staff members")
    }
  }

  return (
    <ProtectedRoute allowedRoles={["rescue"]}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#5A4A42]">Messages</h1>
            <p className="text-sm text-[#2E2E2E]/70">View all conversations with fosters</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#D76B1A] hover:bg-[#C05A0A] text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>New Message</DialogTitle>
                <DialogDescription>Send a message to a foster about their dog</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="foster">Foster *</Label>
                  <select
                    id="foster"
                    value={selectedFoster}
                    onChange={(e) => setSelectedFoster(e.target.value)}
                    className="w-full rounded-lg border border-[#E8DDD1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]"
                  >
                    <option value="">Select a foster...</option>
                    {fosters.map((foster) => (
                      <option key={foster.id} value={foster.id}>
                        {foster.name || foster.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dog">Dog (Optional)</Label>
                  <select
                    id="dog"
                    value={selectedDog}
                    onChange={(e) => setSelectedDog(e.target.value)}
                    disabled={!selectedFoster}
                    className="w-full rounded-lg border border-[#E8DDD1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A] disabled:opacity-50"
                  >
                    <option value="">General message (not about a specific dog)</option>
                    {availableDogs.map((dog) => (
                      <option key={dog.id} value={dog.id}>
                        {dog.name}
                      </option>
                    ))}
                  </select>
                  {!selectedFoster && (
                    <p className="text-xs text-[#2E2E2E]/60">Select a foster first to see their dogs</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team">Team (Optional)</Label>
                  <select
                    id="team"
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full rounded-lg border border-[#E8DDD1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]"
                  >
                    <option value="">No team assigned</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!selectedFoster || !messageContent.trim()}
                  className="bg-[#D76B1A] hover:bg-[#C05A0A] text-white"
                >
                  Send Message
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-[#2E2E2E]/60">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto text-[#2E2E2E]/40 mb-4" />
              <p className="text-[#2E2E2E]/60">No conversations yet</p>
              <p className="text-sm text-[#2E2E2E]/40 mt-1">
                Click "New Message" to start a conversation with a foster
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {conversations.map((conv) => {
                const fosterName = conv.foster?.name || conv.foster?.email || "Unknown Foster"
                const dogName = conv.dog?.name
                let teamMembers: string[] = []
                if (conv.team) {
                  try {
                    const parsed = JSON.parse(conv.team)
                    teamMembers = Array.isArray(parsed) ? parsed : []
                  } catch {
                    // team is a plain string (team name), not a JSON array — treat as no staff members
                    teamMembers = []
                  }
                }
                const teamDisplay =
                  teamMembers.length > 0 ? (
                    <span className="bg-[#F7E2BD] text-[#5A4A42] text-xs px-2.5 py-1 rounded-full font-medium">
                      {teamMembers.length} staff member{teamMembers.length !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="bg-[#FBF8F4] border border-[#E8DDD1] text-[#2E2E2E]/60 text-xs px-2.5 py-1 rounded-full font-medium">
                      Unassigned
                    </span>
                  )

                return (
                  <div key={conv.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">{dogName || "Unknown Dog"}</h3>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedConversationForStaff(conv.id)
                              setShowAddStaffDialog(true)
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Staff Members
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/org/${orgId}/admin/messages/${conv.id}`}>View Conversation</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">Foster: {fosterName}</p>

                    {teamMembers.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Users className="h-3 w-3" />
                        <span>
                          {teamMembers.length} staff member{teamMembers.length !== 1 ? "s" : ""} involved
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Last updated: {new Date(conv.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign Conversation</DialogTitle>
              <DialogDescription>Assign this conversation to a team or specific person</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="assign-team">Team</Label>
                <select
                  id="assign-team"
                  value={assignTeamValue}
                  onChange={(e) => setAssignTeamValue(e.target.value)}
                  className="w-full rounded-lg border border-[#E8DDD1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]"
                >
                  <option value="">No team (unassigned)</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {assignTeamValue && (
                <div className="space-y-2">
                  <Label htmlFor="assign-recipient">Assign to Specific Person (Optional)</Label>
                  <select
                    id="assign-recipient"
                    value={assignRecipient}
                    onChange={(e) => setAssignRecipient(e.target.value)}
                    className="w-full rounded-lg border border-[#E8DDD1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]"
                  >
                    <option value="">Entire team</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.email}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[#2E2E2E]/60">Select a team member to assign directly to them</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignTeam} className="bg-[#D76B1A] hover:bg-[#C05A0A] text-white">
                Save Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Staff to Conversation</DialogTitle>
              <DialogDescription>
                Select staff members who should have access to this conversation with the foster
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableStaff.map((staff) => (
                <div key={staff.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`staff-conv-${staff.id}`}
                    checked={selectedStaffMembers.includes(staff.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStaffMembers([...selectedStaffMembers, staff.id])
                      } else {
                        setSelectedStaffMembers(selectedStaffMembers.filter((id) => id !== staff.id))
                      }
                    }}
                  />
                  <label htmlFor={`staff-conv-${staff.id}`} className="text-sm cursor-pointer flex-1">
                    {staff.name} ({staff.email})
                  </label>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddStaffDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStaffToConversation} disabled={selectedStaffMembers.length === 0}>
                Add {selectedStaffMembers.length} Member{selectedStaffMembers.length !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
