"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/lib/protected-route"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Send, Users, Hash, Search, Plus, UserPlus, Heart, Car, Calendar } from "lucide-react"

type TeamChannel = {
  id: string
  name: string
  type: string
  unreadCount: number
}

type ChatMessage = {
  id: string
  team_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: {
    name: string
    email: string
    org_role: string
  }
}

export default function TeamChatClient() {
  const params = useParams()
  const orgId = params.orgId as string
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [channels, setChannels] = useState<TeamChannel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; org_role: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showInviteMembers, setShowInviteMembers] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelDescription, setNewChannelDescription] = useState("")
  const [newChannelType, setNewChannelType] = useState("general")
  const [availableStaff, setAvailableStaff] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [channelMembers, setChannelMembers] = useState<Array<{ id: string; name: string; role: string }>>([])

  useEffect(() => {
    loadInitialData()
  }, [orgId])

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel)
      loadChannelMembers(selectedChannel)
    }
  }, [selectedChannel])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    loadAvailableStaff()
  }, [orgId])

  async function loadInitialData() {
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from("profiles").select("id, name, org_role").eq("id", user.id).single()

      if (profile) {
        setCurrentUser(profile)
      }

      const { data: teams } = await supabase
        .from("teams")
        .select("id, name, type")
        .eq("organization_id", orgId)
        .order("name")

      if (teams && teams.length > 0) {
        const channelsWithCounts = teams.map((team) => ({
          ...team,
          unreadCount: 0,
        }))
        setChannels(channelsWithCounts)
        setSelectedChannel(teams[0].id)
      }
    } catch (error) {
      console.error("Error loading chat data:", error)
    }
    setIsLoading(false)
  }

  async function loadMessages(teamId: string) {
    try {
      const { data: messagesData, error } = await supabase
        .from("team_messages")
        .select("id, team_id, sender_id, content, created_at")
        .eq("team_id", teamId)
        .order("created_at", { ascending: true })
        .limit(100)

      if (error) {
        console.error("Error loading messages:", error)
        return
      }

      if (messagesData && messagesData.length > 0) {
        const senderIds = [...new Set(messagesData.map((m) => m.sender_id))]
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, email, org_role")
          .in("id", senderIds)

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])

        const enrichedMessages = messagesData.map((msg) => ({
          ...msg,
          sender: profileMap.get(msg.sender_id) || { name: "Unknown", email: "", org_role: "" },
        }))

        setMessages(enrichedMessages)
      } else {
        setMessages([])
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  async function loadChannelMembers(teamId: string) {
    try {
      const { data: members } = await supabase
        .from("team_members")
        .select(`
          id,
          role,
          user_id,
          profiles!team_members_user_id_fkey (
            id,
            name,
            email
          )
        `)
        .eq("team_id", teamId)

      if (members) {
        const enriched = members.map((m) => ({
          id: m.user_id,
          name: m.profiles?.name || "Unknown",
          role: m.role,
        }))
        setChannelMembers(enriched)
      }
    } catch (error) {
      console.error("Error loading channel members:", error)
    }
  }

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

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedChannel || !currentUser || isSending) return

    setIsSending(true)
    const messageContent = newMessage.trim()
    setNewMessage("")

    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      team_id: selectedChannel,
      sender_id: currentUser.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      sender: {
        name: currentUser.name || "You",
        email: "",
        org_role: currentUser.org_role,
      },
    }
    setMessages((prev) => [...prev, optimisticMessage])

    try {
      const { error } = await supabase.from("team_messages").insert({
        team_id: selectedChannel,
        sender_id: currentUser.id,
        content: messageContent,
      })

      if (error) {
        console.error("Error sending message:", error)
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
        setNewMessage(messageContent)
        alert("Failed to send message. Please try again.")
      } else {
        await loadMessages(selectedChannel)
      }
    } catch (error) {
      console.error("Error sending message:", error)
    }
    setIsSending(false)
  }

  async function handleCreateChannel() {
    if (!newChannelName.trim() || !currentUser) return

    try {
      // Create the team/channel
      const { data: newTeam, error: teamError } = await supabase
        .from("teams")
        .insert({
          organization_id: orgId,
          name: newChannelName.trim(),
          description: newChannelDescription.trim(),
          type: newChannelType,
          lead_id: currentUser.id,
        })
        .select()
        .single()

      if (teamError) throw teamError

      // Add creator as member
      await supabase.from("team_members").insert({
        team_id: newTeam.id,
        user_id: currentUser.id,
        role: "lead",
      })

      // Add selected staff members
      if (selectedStaffIds.length > 0) {
        const memberInserts = selectedStaffIds.map((staffId) => ({
          team_id: newTeam.id,
          user_id: staffId,
          role: "member",
        }))
        await supabase.from("team_members").insert(memberInserts)
      }

      // Reload channels
      await loadInitialData()
      setSelectedChannel(newTeam.id)
      setShowCreateChannel(false)
      setNewChannelName("")
      setNewChannelDescription("")
      setSelectedStaffIds([])
    } catch (error) {
      console.error("Error creating channel:", error)
      alert("Failed to create channel")
    }
  }

  async function handleInviteMembers() {
    if (!selectedChannel || selectedStaffIds.length === 0) return

    try {
      const memberInserts = selectedStaffIds.map((staffId) => ({
        team_id: selectedChannel,
        user_id: staffId,
        role: "member",
      }))

      await supabase.from("team_members").insert(memberInserts)

      await loadChannelMembers(selectedChannel)
      setShowInviteMembers(false)
      setSelectedStaffIds([])
    } catch (error) {
      console.error("Error inviting members:", error)
      alert("Failed to invite members")
    }
  }

  function formatMessageTime(timestamp: string) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  function formatMessageDate(timestamp: string) {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    }
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case "org_admin":
        return <span className="px-1.5 py-0.5 text-xs rounded bg-[#D76B1A] text-white">Admin</span>
      case "staff":
        return <span className="px-1.5 py-0.5 text-xs rounded bg-[#E8EFE6] text-[#5A4A42]">Staff</span>
      default:
        return null
    }
  }

  const groupedMessages: { date: string; messages: ChatMessage[] }[] = []
  let currentDate = ""
  messages.forEach((msg) => {
    const msgDate = formatMessageDate(msg.created_at)
    if (msgDate !== currentDate) {
      currentDate = msgDate
      groupedMessages.push({ date: msgDate, messages: [msg] })
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg)
    }
  })

  const selectedChannelData = channels.find((c) => c.id === selectedChannel)
  const filteredChannels = channels.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <p className="text-[#2E2E2E]/60">Loading chat...</p>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["rescue"]}>
      <div className="flex h-[calc(100vh-4rem)] bg-background">
        {/* Channels Sidebar */}
        <div className="w-64 border-r bg-card flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Team Channels</h2>
            <Button size="sm" variant="ghost" onClick={() => setShowCreateChannel(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-3 border-b">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-sm bg-background"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChannels.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-4 text-center">No channels found</p>
            ) : (
              filteredChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`w-full px-4 py-3 flex items-center gap-2 hover:bg-accent text-left ${
                    selectedChannel === channel.id ? "bg-accent" : ""
                  }`}
                >
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 font-medium truncate">{channel.name}</span>
                  {channel.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                      {channel.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChannel && (
            <>
              {/* Channel Header */}
              <div className="h-16 border-b px-6 flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h1 className="font-semibold">{channels.find((c) => c.id === selectedChannel)?.name}</h1>
                    <p className="text-sm text-muted-foreground">
                      {channelMembers.length} member{channelMembers.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowInviteMembers(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Users className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Hash className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">No messages yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Start the conversation! Messages here are only visible to team members.
                    </p>
                  </div>
                ) : (
                  groupedMessages.map((group, idx) => (
                    <div key={idx}>
                      <div className="flex items-center gap-4 my-4">
                        <div className="flex-1 h-px bg-muted" />
                        <span className="text-xs text-muted-foreground font-medium">{group.date}</span>
                        <div className="flex-1 h-px bg-muted" />
                      </div>

                      {group.messages.map((msg) => (
                        <div key={msg.id} className="flex gap-3 mb-4">
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground flex-shrink-0">
                            {msg.sender?.name?.charAt(0) || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-muted-foreground">{msg.sender?.name || "Unknown"}</span>
                              {getRoleBadge(msg.sender?.org_role || "")}
                              <span className="text-xs text-muted-foreground">{formatMessageTime(msg.created_at)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-card">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder={`Message #${selectedChannelData?.name}...`}
                    disabled={!selectedChannel || isSending}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !selectedChannel || isSending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send • This chat is only visible to rescue staff
                </p>
              </div>
            </>
          )}
        </div>

        {/* Create Channel Dialog */}
        <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Create New Channel</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Create a dedicated channel for your team to collaborate and communicate
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="channel-name" className="text-sm font-medium">
                  Channel Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="channel-name"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g., foster-coordinators"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Use lowercase letters, numbers, and hyphens</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="channel-description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="channel-description"
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  placeholder="What is this channel for?"
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Help members understand the channel's purpose</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="channel-type" className="text-sm font-medium">
                  Channel Type
                </Label>
                <Select value={newChannelType} onValueChange={setNewChannelType}>
                  <SelectTrigger id="channel-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        <span>General</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="foster_coordination">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Foster Coordination</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medical">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        <span>Medical Team</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="transport">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        <span>Transport Team</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="events">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Events</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Invite Staff Members</Label>
                <p className="text-xs text-muted-foreground mb-2">Select team members to add to this channel</p>
                <div className="border rounded-lg p-3 max-h-52 overflow-y-auto bg-muted/30">
                  {availableStaff.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No staff members available</p>
                  ) : (
                    <div className="space-y-2.5">
                      {availableStaff.map((staff) => (
                        <div
                          key={staff.id}
                          className="flex items-center space-x-3 p-2 rounded-md hover:bg-background transition-colors"
                        >
                          <Checkbox
                            id={`staff-${staff.id}`}
                            checked={selectedStaffIds.includes(staff.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStaffIds([...selectedStaffIds, staff.id])
                              } else {
                                setSelectedStaffIds(selectedStaffIds.filter((id) => id !== staff.id))
                              }
                            }}
                          />
                          <label
                            htmlFor={`staff-${staff.id}`}
                            className="text-sm cursor-pointer flex-1 flex items-center gap-2"
                          >
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {staff.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{staff.name}</p>
                              <p className="text-xs text-muted-foreground">{staff.email}</p>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedStaffIds.length > 0 && (
                  <p className="text-xs text-primary font-medium mt-2">
                    {selectedStaffIds.length} member{selectedStaffIds.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowCreateChannel(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateChannel} disabled={!newChannelName.trim()}>
                <Hash className="h-4 w-4 mr-2" />
                Create Channel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invite Members Dialog */}
        <Dialog open={showInviteMembers} onOpenChange={setShowInviteMembers}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Staff to Channel</DialogTitle>
              <DialogDescription>Select staff members to add to this channel</DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              {availableStaff
                .filter((staff) => !channelMembers.find((m) => m.id === staff.id))
                .map((staff) => (
                  <div key={staff.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`invite-${staff.id}`}
                      checked={selectedStaffIds.includes(staff.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStaffIds([...selectedStaffIds, staff.id])
                        } else {
                          setSelectedStaffIds(selectedStaffIds.filter((id) => id !== staff.id))
                        }
                      }}
                    />
                    <label htmlFor={`invite-${staff.id}`} className="text-sm cursor-pointer flex-1">
                      {staff.name} ({staff.email})
                    </label>
                  </div>
                ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteMembers(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteMembers} disabled={selectedStaffIds.length === 0}>
                Invite {selectedStaffIds.length} Member{selectedStaffIds.length !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
