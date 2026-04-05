"use client"

import type React from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { put } from "@vercel/blob"

const MessageSquare = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const Plus = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
)

const ImageIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default function OrgFosterMessages() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string

  const [user, setUser] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [dogs, setDogs] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [teamFilter, setTeamFilter] = useState<string>("all")
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [selectedDog, setSelectedDog] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("")
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<any[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState("")
  const [messageContent, setMessageContent] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [orgId])

  async function loadData() {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) return

      // Get user profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()
      setUser(profile)

      // Get organization
      const { data: org } = await supabase.from("organizations").select("*").eq("id", orgId).single()
      setOrganization(org)

      // Get dogs assigned to this foster in this org FIRST
      const { data: dogsData } = await supabase
        .from("dogs")
        .select("*")
        .eq("foster_id", authUser.id)
        .eq("organization_id", orgId)

      setDogs(dogsData || [])

      // Get foster's dog IDs to filter conversations
      const fosterDogIds = (dogsData || []).map((d: any) => d.id)

      // Get conversations for this foster - only where dog_id is one of their dogs
      let convs: any[] = []
      if (fosterDogIds.length > 0) {
        const { data: convsData } = await supabase
          .from("conversations")
          .select("*, dog:dogs(*)")
          .eq("organization_id", orgId)
          .in("dog_id", fosterDogIds)
          .order("updated_at", { ascending: false })
        convs = convsData || []
      }

      setConversations(convs)

      // Fetch teams from the teams table with their members
      const { data: teamsData } = await supabase
        .from("teams")
        .select(`
          id,
          name,
          type,
          team_members(
            user_id,
            profile:profiles(id, name, email)
          )
        `)
        .eq("organization_id", orgId)
        .order("name", { ascending: true })

      console.log("[v0] Loaded teams from database:", teamsData)

      // Transform teams data to include member info
      const transformedTeams = (teamsData || []).map((team: any) => ({
        id: team.id,
        name: team.name,
        type: team.type,
        members: (team.team_members || []).map((tm: any) => tm.profile).filter(Boolean),
      }))

      console.log("[v0] Transformed teams with members:", transformedTeams)

      setTeams(transformedTeams)
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      setLoading(false)
    }
  }

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeam(teamId)
    const team = teams.find((t) => t.id === teamId)
    setSelectedTeamMembers(team?.members || [])
    setSelectedRecipient("") // Reset recipient when team changes
    console.log("[v0] Team selected:", { teamId, teamName: team?.name, memberCount: team?.members?.length })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/")
      const isVideo = file.type.startsWith("video/")
      const isUnder10MB = file.size < 10 * 1024 * 1024 // 10MB limit
      return (isImage || isVideo) && isUnder10MB
    })

    setAttachments([...attachments, ...validFiles])
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const isSingleDog = dogs.length === 1

  const handleNewMessage = () => {
    if (isSingleDog) {
      setSelectedDog(dogs[0].id)
    }
    setShowNewMessage(true)
  }

  const handleSendNewMessage = async () => {
    if (!user || !messageContent.trim() || (!isSingleDog && !selectedDog)) {
      return
    }

    setSending(true)

    try {
      const [subject, ...bodyLines] = messageContent.split("\n")
      const body = bodyLines.join("\n").trim()

      const dogId = isSingleDog ? dogs[0].id : selectedDog

      const conversationData: any = {
        organization_id: orgId,
        dog_id: dogId,
        team: "general",
      }

      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert(conversationData)
        .select()
        .single()

      if (convError) {
        throw convError
      }

      const messageData = {
        conversation_id: conversation.id,
        sender_id: user.id,
        content: subject + "\n\n" + body,
      }

      const { error: msgError } = await supabase.from("messages").insert(messageData).select().single()

      if (msgError) {
        throw msgError
      }

      setSending(false)
      setShowNewMessage(false)
      setMessageContent("")
      setSelectedDog("")
      setAttachments([])

      // Notify org admin
      try {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("id, name")
          .eq("id", user.id)
          .single()

        const { data: orgAdmin } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("organization_id", orgId)
          .eq("role", "rescue")
          .eq("org_role", "org_admin")
          .limit(1)
          .maybeSingle()

        const { data: org } = await supabase.from("organizations").select("name").eq("id", orgId).single()

        if (orgAdmin && userProfile && org) {
          await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "message-to-org",
              orgEmail: orgAdmin.email,
              orgName: org.name,
              fosterName: userProfile.name,
              dogName: "their foster",
            }),
          })
        }
      } catch (emailError) {
        console.warn("[v0] Failed to send message email:", emailError)
      }

      router.push(`/org/${orgId}/foster/messages/${conversation.id}`)
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setSending(false)
      alert("Failed to send message. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="bg-[#FBF8F4] min-h-screen flex items-center justify-center">
        <p className="text-[#2E2E2E]/60">Loading messages...</p>
      </div>
    )
  }

  return (
    <div className="bg-[#FBF8F4]">
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#5A4A42] mb-2">Contact Your Rescue Team</h1>
          <p className="text-[#2E2E2E]/70">Have a question about your foster dog? Message your rescue coordinator directly.</p>
        </div>

        {/* Send Message Button */}
        <div className="mb-8">
          <button
            onClick={handleNewMessage}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D76B1A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Send a Message
          </button>
        </div>

        {/* Conversations List */}
        <div className="space-y-3">
          {conversations.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <MessageSquare className="w-12 h-12 text-[#2E2E2E]/20 mx-auto mb-3" />
              <p className="text-[#2E2E2E]/60 mb-4">No messages yet</p>
              <button
                onClick={handleNewMessage}
                className="inline-flex items-center gap-2 rounded-xl bg-[#D76B1A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition"
              >
                <Plus className="w-4 h-4" />
                Start a conversation
              </button>
            </div>
          ) : (
            conversations.map((conversation) => {
              const dog = conversation.dog
              const lastMessage = conversation.last_message || "No messages yet"
              const preview = lastMessage.substring(0, 60) + (lastMessage.length > 60 ? "..." : "")

              return (
                <Link key={conversation.id} href={`/org/${orgId}/foster/messages/${conversation.id}`}>
                  <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition cursor-pointer border border-[#F7E2BD]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[#5A4A42]">
                            {dog?.name || "Rescue Team"}
                          </h3>
                        </div>
                        <p className="text-sm text-[#2E2E2E]/60 mb-2 line-clamp-1">{preview}</p>
                        <p className="text-xs text-[#2E2E2E]/40">{new Date(conversation.updated_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </main>

      {showNewMessage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#F7E2BD] px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#5A4A42]">Send a Message</h3>
              <button
                onClick={() => {
                  setShowNewMessage(false)
                  setMessageContent("")
                  setSelectedDog("")
                  setSelectedTeam("")
                  setSelectedRecipient("")
                  setAttachments([])
                }}
                className="text-[#2E2E2E]/60 hover:text-[#2E2E2E] transition"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Dog Selection */}
              {!isSingleDog && (
                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">Which dog is this about? *</label>
                  <select
                    value={selectedDog}
                    onChange={(e) => setSelectedDog(e.target.value)}
                    className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A]"
                    required
                  >
                    <option value="">Select a dog</option>
                    {dogs.map((dog) => (
                      <option key={dog.id} value={dog.id}>
                        {dog.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-[#5A4A42] mb-2">Subject *</label>
                <input
                  type="text"
                  value={messageContent.split("\n")[0] || ""}
                  onChange={(e) => {
                    const lines = messageContent.split("\n")
                    lines[0] = e.target.value
                    setMessageContent(lines.join("\n"))
                  }}
                  placeholder="What is your message about?"
                  className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A]"
                />
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-sm font-medium text-[#5A4A42] mb-2">Message *</label>
                <textarea
                  value={messageContent.includes("\n") ? messageContent.split("\n").slice(1).join("\n") : ""}
                  onChange={(e) => {
                    const subject = messageContent.split("\n")[0] || ""
                    setMessageContent(subject + "\n" + e.target.value)
                  }}
                  placeholder="Type your message here..."
                  className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A] resize-none min-h-[120px]"
                />
              </div>

              <button
                onClick={handleSendNewMessage}
                disabled={
                  sending ||
                  uploading ||
                  !messageContent.trim() ||
                  (!isSingleDog && !selectedDog)
                }
                className="w-full inline-flex items-center justify-center rounded-xl bg-[#D76B1A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
              >
                {uploading ? "Uploading attachments..." : sending ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}

              {/* Team Selection */}
              <div>
                <label className="block text-sm font-medium text-[#5A4A42] mb-2">
                  Which team would you like to contact? *
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => handleTeamSelect(e.target.value)}
                  className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A]"
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                  <option value="general">General Question</option>
                </select>
              </div>

              {/* Recipient Selection (Team Members) */}
              {selectedTeam && selectedTeam !== "general" && (
                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">
                    Who would you like to message? *
                  </label>
                  <select
                    value={selectedRecipient}
                    onChange={(e) => setSelectedRecipient(e.target.value)}
                    className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A]"
                  >
                    <option value="">Select a team member</option>
                    {selectedTeamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedTeam === "general" && !selectedRecipient && (
                <div className="text-sm text-[#2E2E2E]/60 bg-[#FBF8F4] p-3 rounded-xl">
                  Your message will be sent to the rescue organization team.
                </div>
              )}

              {/* Message Content */}
              <div>
                <label className="block text-sm font-medium text-[#5A4A42] mb-2">Message *</label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder={`${isSingleDog ? `Ask about ${dogs[0]?.name}...` : "Type your message..."}`}
                  className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A] resize-none min-h-[120px]"
                />
              </div>

              {/* File Attachments */}
              <div>
                <label className="block text-sm font-medium text-[#5A4A42] mb-2">Attach Photos/Videos (optional)</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-[#F7E2BD] bg-[#FBF8F4] px-4 py-6 text-sm cursor-pointer hover:border-[#D76B1A] transition"
                >
                  <ImageIcon className="w-5 h-5 text-[#D76B1A]" />
                  <span className="text-[#5A4A42]">Click to add images or videos</span>
                </label>
                <p className="text-xs text-[#2E2E2E]/40 mt-1">Max 10MB per file</p>

                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 bg-[#FBF8F4] p-2 rounded-lg">
                        <ImageIcon className="w-4 h-4 text-[#D76B1A]" />
                        <span className="text-sm text-[#5A4A42] flex-1 truncate">{file.name}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="p-1 hover:bg-white rounded transition"
                        >
                          <XIcon className="w-4 h-4 text-[#2E2E2E]/60" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleSendNewMessage}
                disabled={
                  sending ||
                  uploading ||
                  !messageContent.trim() ||
                  (!isSingleDog && !selectedDog) ||
                  !selectedTeam ||
                  (selectedTeam !== "general" && !selectedRecipient)
                }
                className="w-full inline-flex items-center justify-center rounded-xl bg-[#D76B1A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
              >
                {uploading ? "Uploading attachments..." : sending ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
