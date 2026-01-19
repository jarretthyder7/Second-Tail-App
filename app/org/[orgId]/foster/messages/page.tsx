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

      // Get conversations for this foster in this org
      const { data: convs } = await supabase
        .from("conversations")
        .select("*, dog:dogs(*)")
        .eq("organization_id", orgId)
        .order("updated_at", { ascending: false })

      setConversations(convs || [])

      // Get dogs assigned to this foster in this org
      const { data: dogsData } = await supabase
        .from("dogs")
        .select("*")
        .eq("foster_id", authUser.id)
        .eq("organization_id", orgId)

      setDogs(dogsData || [])

      const { data: teamProfiles } = await supabase
        .from("profiles")
        .select("id, name, email, teams, team_leads")
        .eq("organization_id", orgId)
        .not("teams", "is", null)

      // Extract unique teams from all users
      const teamSet = new Set<string>()
      teamProfiles?.forEach((profile) => {
        if (profile.teams && Array.isArray(profile.teams)) {
          profile.teams.forEach((team: string) => teamSet.add(team))
        }
      })

      const teamsData = Array.from(teamSet).map((teamName) => ({
        name: teamName,
        members:
          teamProfiles
            ?.filter((p) => p.teams?.includes(teamName))
            .map((p) => ({ id: p.id, name: p.name, email: p.email })) || [],
      }))

      setTeams(teamsData)
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      setLoading(false)
    }
  }

  const handleTeamSelect = (teamName: string) => {
    setSelectedTeam(teamName)
    const team = teams.find((t) => t.name === teamName)
    setSelectedTeamMembers(team?.members || [])
    setSelectedRecipient("") // Reset recipient when team changes
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
    if (!user || !messageContent.trim() || (!isSingleDog && !selectedDog) || !selectedTeam) {
      return
    }

    setSending(true)
    setUploading(true)

    try {
      console.log("[v0] Starting message send process:", {
        userId: user.id,
        orgId,
        dogId: isSingleDog ? dogs[0].id : selectedDog,
        team: selectedTeam,
        recipientId: selectedRecipient,
        hasAttachments: attachments.length > 0,
      })

      // Upload attachments first
      const uploadedUrls: string[] = []
      for (const file of attachments) {
        const blob = await put(file.name, file, { access: "public" })
        uploadedUrls.push(blob.url)
      }

      setUploading(false)

      const dogId = isSingleDog ? dogs[0].id : selectedDog
      const conversationData: any = {
        organization_id: orgId,
        dog_id: dogId,
        team: selectedTeam,
      }

      // Only add recipient_id if it's not a general message
      if (selectedTeam !== "general" && selectedRecipient) {
        conversationData.recipient_id = selectedRecipient
      }

      console.log("[v0] Creating conversation with data:", conversationData)

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert(conversationData)
        .select()
        .single()

      if (convError) {
        console.error("[v0] Error creating conversation:", convError)
        throw convError
      }

      console.log("[v0] Conversation created:", conversation)

      // Create first message with attachments
      const messageData = {
        conversation_id: conversation.id,
        sender_id: user.id,
        content: messageContent,
        attachments: uploadedUrls.length > 0 ? uploadedUrls : null,
      }

      console.log("[v0] Creating message with data:", messageData)

      const { data: message, error: msgError } = await supabase.from("messages").insert(messageData).select().single()

      if (msgError) {
        console.error("[v0] Error creating message:", msgError)
        throw msgError
      }

      console.log("[v0] Message created successfully:", message)

      setSending(false)
      setShowNewMessage(false)
      setMessageContent("")
      setSelectedDog("")
      setSelectedTeam("")
      setSelectedRecipient("")
      setAttachments([])

      // Navigate to new conversation
      router.push(`/org/${orgId}/foster/messages/${conversation.id}`)
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setSending(false)
      setUploading(false)
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#5A4A42]">Messages</h2>
          <button
            onClick={handleNewMessage}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D76B1A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New message
          </button>
        </div>

        <div className="space-y-4">
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

              return (
                <Link key={conversation.id} href={`/org/${orgId}/foster/messages/${conversation.id}`}>
                  <div className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#D76B1A] flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {organization?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-[#5A4A42]">{organization?.name}</h3>
                          </div>
                          <span className="text-xs text-[#2E2E2E]/40 flex-shrink-0">
                            {new Date(conversation.updated_at).toLocaleDateString()}
                          </span>
                        </div>

                        {dog && <p className="text-sm text-[#2E2E2E]/60">About: {dog.name}</p>}
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
              <h3 className="text-xl font-bold text-[#5A4A42]">New Message</h3>
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
                    <option key={team.name} value={team.name}>
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
