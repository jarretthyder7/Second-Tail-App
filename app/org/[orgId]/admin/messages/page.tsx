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
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const fosterName = (conv.foster?.name || conv.foster?.email || "").toLowerCase()
    const dogName = (conv.dog?.name || "").toLowerCase()
    return fosterName.includes(q) || dogName.includes(q)
  })

  const supabase = createClient()

  useEffect(() => {
    loadData()
    loadAvailableStaff()
  }, [orgId])

  // Realtime: refresh list when any new message lands in any org conversation,
  // or when a message is marked read. Debounced so a burst of updates only
  // triggers one reload.
  useEffect(() => {
    if (!orgId) return
    let timer: any = null
    const scheduleReload = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => loadData(), 350)
    }
    const channel = supabase
      .channel(`admin-messages-list:${orgId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        scheduleReload
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        scheduleReload
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations", filter: `organization_id=eq.${orgId}` },
        scheduleReload
      )
      .subscribe()
    return () => {
      if (timer) clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [orgId])

  async function loadData() {
    try {


      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        return
      }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()
      setUser(profile)

      // Get all dogs in this organization
      const { data: orgDogs } = await supabase
        .from("dogs")
        .select("foster_id")
        .eq("organization_id", orgId)
        .not("foster_id", "is", null)

      // Get unique foster IDs from the dogs
      const fosterIds = [...new Set(orgDogs?.map((d) => d.foster_id).filter(Boolean) || [])]

      // Fetch foster profiles - either directly assigned to org OR connected via dogs
      let fosterProfiles = []
      if (fosterIds.length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("id, name, email")
          .or(`organization_id.eq.${orgId},id.in.(${fosterIds.join(",")})`)
          .eq("role", "foster")

        fosterProfiles = data || []
      } else {
        // Fallback to just checking organization_id if no dogs are assigned
        const { data } = await supabase
          .from("profiles")
          .select("id, name, email")
          .eq("organization_id", orgId)
          .eq("role", "foster")

        fosterProfiles = data || []
      }

      setFosters(fosterProfiles || [])

      const { data: teamsData } = await supabase
        .from("teams")
        .select("id, name")
        .eq("organization_id", orgId)

      setTeams(teamsData || [])

      // Load conversations with unread counts + last message via the admin API
      const res = await fetch(`/api/admin/conversations?orgId=${orgId}`)
      const apiJson = await res.json().catch(() => ({}))
      const apiConvs: any[] = Array.isArray(apiJson?.conversations) ? apiJson.conversations : []

      // The API returns recipient + dog (with nested foster) + last_message + unread_count.
      // Normalize so the render code can just use conv.foster.
      const transformedConvs = apiConvs.map((conv) => ({
        ...conv,
        dog: conv.dog || null,
        foster: conv.recipient || conv.dog?.foster || { name: "Unknown Foster", email: "" },
        last_message: conv.last_message || null,
        unread_count: conv.unread_count || 0,
      }))

      setConversations(transformedConvs)
      setLoading(false)
    } catch (error) {
      console.error("Error loading data:", error)
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

        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert(conversationData)
          .select()
          .single()

        if (convError) {
          console.error("Error creating conversation:", convError)
          throw convError
        }

        conversationId = newConv.id
      }

      const { error: msgError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: messageContent,
      })

      if (msgError) {
        console.error("Error creating message:", msgError)
        throw msgError
      }

      // Reset form
      setSelectedFoster("")
      setSelectedDog("")
      setSelectedTeam("")
      setMessageContent("")
      setOpen(false)

      // Refresh conversations
      await loadData()
    } catch (error) {
      console.error("Failed to send message:", error)
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
      console.error("Failed to assign team:", error)
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

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4A42]/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by foster or dog name..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-full bg-white border border-[#F7E2BD] focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/20"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-[#2E2E2E]/60">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#FDF6EC] flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-[#D76B1A]" />
              </div>
              <p className="text-[#5A4A42] font-medium">
                {searchQuery ? "No matches" : "No conversations yet"}
              </p>
              <p className="text-sm text-[#2E2E2E]/50 mt-1">
                {searchQuery ? "Try a different search term." : "Click \"New Message\" to start one."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#F7E2BD]/60">
              {filteredConversations.map((conv) => {
                const fosterName = conv.foster?.name || conv.foster?.email || "Unknown Foster"
                const dogName = conv.dog?.name
                const unread = Number(conv.unread_count || 0)
                const lastMsg = conv.last_message
                const isFromFoster = lastMsg && conv.foster?.id && lastMsg.sender_id === conv.foster.id

                // Last-updated label: "Now" / "12m" / "3h" / "2d" / "Mar 14"
                const ts = lastMsg?.created_at || conv.updated_at
                const d = ts ? new Date(ts) : null
                const diffMs = d ? Date.now() - d.getTime() : 0
                let timeLabel = ""
                if (d) {
                  const m = Math.floor(diffMs / 60000)
                  const h = Math.floor(diffMs / 3600000)
                  const days = Math.floor(diffMs / 86400000)
                  if (m < 1) timeLabel = "Now"
                  else if (m < 60) timeLabel = `${m}m`
                  else if (h < 24) timeLabel = `${h}h`
                  else if (days < 7) timeLabel = `${days}d`
                  else timeLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }

                // Avatar initial: prefer foster name, fall back to email
                const initial = (fosterName || "?").trim().charAt(0).toUpperCase()

                // Truncate message preview
                const preview = lastMsg?.content
                  ? (lastMsg.content.length > 80 ? lastMsg.content.slice(0, 77) + "..." : lastMsg.content)
                  : "No messages yet"

                return (
                  <li key={conv.id} className="relative group">
                    <Link
                      href={`/org/${orgId}/admin/messages/${conv.id}`}
                      className="flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-[#FBF8F4] transition-colors"
                    >
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        unread > 0 ? "bg-[#D76B1A] text-white" : "bg-[#F7E2BD] text-[#5A4A42]"
                      }`}>
                        <span className="font-semibold">{initial}</span>
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`truncate ${unread > 0 ? "font-bold text-[#2E2E2E]" : "font-semibold text-[#5A4A42]"}`}>
                            {fosterName}
                          </span>
                          {dogName && (
                            <span className="text-xs text-[#5A4A42]/60 bg-[#FBF8F4] px-1.5 py-0.5 rounded-full flex-shrink-0">
                              {dogName}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate ${unread > 0 ? "text-[#2E2E2E] font-medium" : "text-[#2E2E2E]/60"}`}>
                          {isFromFoster ? "" : "You: "}{preview}
                        </p>
                      </div>

                      {/* Right side: timestamp + unread badge */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-xs ${unread > 0 ? "text-[#D76B1A] font-semibold" : "text-[#2E2E2E]/50"}`}>
                          {timeLabel}
                        </span>
                        {unread > 0 ? (
                          <span className="bg-[#D76B1A] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        ) : (
                          <span className="w-5 h-5" />
                        )}
                      </div>
                    </Link>

                    {/* Three-dot menu overlay */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="pointer-events-auto">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="bg-white/90 backdrop-blur-sm shadow-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                setSelectedConversationForStaff(conv.id)
                                setShowAddStaffDialog(true)
                              }}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add Staff Members
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
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
