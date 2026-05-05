"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { put } from "@vercel/blob"
import { ArrowLeft, Send, Paperclip, ImageIcon, X, ExternalLink, Plus, Users } from "lucide-react"

export default function AdminConversationPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.conversationId as string
  const orgId = params.orgId as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [user, setUser] = useState<any>(null)
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [foster, setFoster] = useState<any>(null)
  const [dog, setDog] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [newMessage, setNewMessage] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  // Participants beyond the original recipient — additional rescue staff brought into the chat.
  const [participants, setParticipants] = useState<any[]>([])
  const [showParticipantPicker, setShowParticipantPicker] = useState(false)
  const [orgStaff, setOrgStaff] = useState<any[]>([])
  const [addingParticipant, setAddingParticipant] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  // Realtime: listen for new messages + read receipts on this conversation.
  useEffect(() => {
    if (!conversationId) return
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const newMsg: any = payload.new
          // Skip messages we just sent (already in local state).
          if (user?.id && newMsg.sender_id === user.id) return
          // Fetch sender info to match the existing message shape.
          const { data: sender } = await supabase
            .from("profiles")
            .select("id, name, email")
            .eq("id", newMsg.sender_id)
            .maybeSingle()
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, { ...newMsg, sender }]
          })
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const updated: any = payload.new
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)))
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, user?.id])

  useEffect(() => {
    if (user && messages.length > 0) {
      markMessagesAsRead()
    }
  }, [messages.length, user]) // Updated to use user instead of user?.id

  async function loadData() {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()
      setUser(profile)

      // Get conversation including the primary recipient (so we can render them as the
      // first chip alongside any added participants)
      const { data: convs, error: convsError } = await supabase
        .from("conversations")
        .select(
          "*, dog:dogs(*), recipient:profiles!conversations_recipient_id_fkey(id, name, email, role, org_role)",
        )
        .eq("id", conversationId)
        .single()

      setConversation(convs)
      setDog(convs?.dog)

      if (convs?.dog?.foster_id) {
        const { data: fosterProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", convs.dog.foster_id)
          .single()
        setFoster(fosterProfile)
      }

      const { data: msgs } = await supabase
        .from("messages")
        .select(
          "*, sender:profiles!messages_sender_id_fkey(id, name, email), read_by_profile:profiles!messages_read_by_fkey(id, name)",
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      setMessages(msgs || [])

      // Load participants (additional staff added to the conversation)
      try {
        const partsRes = await fetch(`/api/admin/conversations/${conversationId}/participants`)
        if (partsRes.ok) {
          const partsData = await partsRes.json()
          setParticipants(partsData.participants || [])
        }
      } catch (err) {
        console.warn("Could not load participants:", err)
      }

      setLoading(false)
    } catch (error) {
      console.error("Error loading conversation:", error)
      setLoading(false)
    }
  }

  const openParticipantPicker = async () => {
    if (orgStaff.length === 0) {
      // Lazy-load org rescue staff once
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, name, email, role, org_role")
          .eq("organization_id", orgId)
          .eq("role", "rescue")
        setOrgStaff(data || [])
      } catch (err) {
        console.warn("Could not load org staff:", err)
      }
    }
    setShowParticipantPicker(true)
  }

  const addParticipant = async (userId: string) => {
    setAddingParticipant(userId)
    try {
      const res = await fetch(`/api/admin/conversations/${conversationId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error("Add participant failed:", result.error)
        return
      }
      if (result.alreadyParticipant) {
        // No-op — already there
      } else if (result.participant) {
        setParticipants((prev) => [...prev, result.participant])
      }
      setShowParticipantPicker(false)
    } catch (err) {
      console.error("Add participant error:", err)
    } finally {
      setAddingParticipant(null)
    }
  }

  // The recipient is the "primary" rescue contact already on the conversation. We surface them
  // alongside the explicitly-added participants so the foster sees a complete roster.
  const allRescueInChat = (() => {
    const primary = conversation?.recipient
    const list: any[] = []
    if (primary && primary.role === "rescue") {
      list.push({ id: primary.id, user: primary, isPrimary: true })
    }
    participants.forEach((p) => {
      if (p?.user?.id && !list.some((x) => x.id === p.user.id)) {
        list.push({ id: p.user.id, user: p.user, isPrimary: false })
      }
    })
    return list
  })()

  const eligibleStaffToAdd = orgStaff.filter(
    (s) => s.id !== user?.id && !allRescueInChat.some((p) => p.user?.id === s.id),
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/")
      const isVideo = file.type.startsWith("video/")
      const isUnder10MB = file.size < 10 * 1024 * 1024
      return (isImage || isVideo) && isUnder10MB
    })

    setAttachments([...attachments, ...validFiles])
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if (!newMessage.trim() && attachments.length === 0) return
    if (!user) return

    setSending(true)
    setUploading(true)

    try {
      // Upload attachments
      const uploadedUrls: string[] = []
      for (const file of attachments) {
        const blob = await put(file.name, file, { access: "public" })
        uploadedUrls.push(blob.url)
      }

      setUploading(false)

      // Send message
      const { data: message, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage,
          attachments: uploadedUrls,
        })
        .select()
        .single()

      if (error) throw error

      // Update conversation timestamp
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId)

      // Hand off to the central notification service. The server resolves
      // the foster recipient, checks the 10-min read-debounce + foster prefs,
      // and dispatches email (and later push). Fire-and-forget.
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: { type: "message.new", conversationId } }),
      }).catch((err) => console.warn("Failed to trigger notification:", err))

      setMessages([...messages, message])
      setNewMessage("")
      setAttachments([])
      setSending(false)

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (error) {
      console.error("Error sending message:", error)
      setSending(false)
      setUploading(false)
      alert("Failed to send message. Please try again.")
    }
  }

  async function markMessagesAsRead() {
    if (!user) return

    try {
      // Get all unread messages not sent by current user
      const unreadMessages = messages.filter((msg) => msg.sender_id !== user.id && !msg.read_at)

      if (unreadMessages.length === 0) return

      // Mark messages as read
      const messageIds = unreadMessages.map((msg) => msg.id)
      await supabase
        .from("messages")
        .update({
          read_at: new Date().toISOString(),
          read_by: user.id,
        })
        .in("id", messageIds)


    } catch (error) {
      console.error("Error marking messages as read:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex items-center justify-center">
        <p className="text-[#2E2E2E]/60">Loading conversation...</p>
      </div>
    )
  }

  if (!conversation || !user) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex items-center justify-center">
        <p className="text-[#2E2E2E]/60">Conversation not found</p>
      </div>
    )
  }

  return (
    // h-dvh (dynamic viewport height) accounts for mobile browser chrome
    // (URL bar etc.) so the input bar stays inside the visible area instead
    // of being pushed below the bottom of the screen.
    <div className="h-dvh flex flex-col bg-[#FBF8F4] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-[#F7E2BD]/20 px-3 sm:px-4 py-3 sm:py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href={`/org/${orgId}/admin/messages`}>
              <button className="p-1.5 sm:p-2 hover:bg-[#FBF8F4] rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-[#5A4A42]" />
              </button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="font-bold text-base sm:text-lg text-[#5A4A42]">
                  {foster?.name || foster?.email || "Foster"}
                </h1>
                {conversation?.team && (
                  <span
                    className="bg-[#F7E2BD] text-[#5A4A42] text-xs px-2 py-0.5 rounded-full font-medium"
                    title="Team responsible for answering"
                  >
                    {conversation.team}
                  </span>
                )}
              </div>
              {dog && (
                <Link
                  href={`/org/${orgId}/admin/animals/${dog.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-[#D76B1A] hover:text-[#C25E15] hover:underline truncate inline-flex items-center gap-1"
                  title={`Open ${dog.name}'s profile in a new tab`}
                >
                  About {dog.name}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </Link>
              )}

              {/* Participant chips — rescue staff in the conversation. Shows the primary
                  recipient + any teammates that have been added via the picker below. */}
              <div className="flex items-center flex-wrap gap-1.5 mt-2">
                <Users className="w-3 h-3 text-[#5A4A42]/50 flex-shrink-0" />
                {allRescueInChat.length === 0 && (
                  <span className="text-xs text-[#5A4A42]/50">Just you</span>
                )}
                {allRescueInChat.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FBF8F4] border border-[#F7E2BD] text-[11px] text-[#5A4A42]"
                    title={p.user?.email || ""}
                  >
                    {p.user?.name || p.user?.email || "Staff"}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={openParticipantPicker}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-[#D76B1A]/40 text-[11px] text-[#D76B1A] hover:bg-[#D76B1A]/5 transition"
                  title="Add a teammate to this chat"
                >
                  <Plus className="w-3 h-3" />
                  Add teammate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Participant picker modal */}
      {showParticipantPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowParticipantPicker(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#F7E2BD] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#5A4A42]">Add teammate to chat</h3>
                <p className="text-xs text-[#5A4A42]/60 mt-0.5">
                  They'll be able to see and reply to this conversation. The foster will see them in the chat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowParticipantPicker(false)}
                className="p-1 hover:bg-[#FBF8F4] rounded"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-[#5A4A42]/70" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {eligibleStaffToAdd.length === 0 ? (
                <p className="p-6 text-sm text-[#5A4A42]/60 text-center">
                  Everyone on your team is already in this chat.
                </p>
              ) : (
                <div className="divide-y divide-[#F7E2BD]">
                  {eligibleStaffToAdd.map((staff) => (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => addParticipant(staff.id)}
                      disabled={addingParticipant === staff.id}
                      className="w-full px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#FBF8F4] transition text-left disabled:opacity-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#5A4A42] truncate">
                          {staff.name || staff.email}
                        </p>
                        <p className="text-xs text-[#5A4A42]/60 truncate">
                          {staff.org_role
                            ? staff.org_role
                                .split("_")
                                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(" ")
                            : "Staff"}
                          {staff.email && ` · ${staff.email}`}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-[#D76B1A]">
                        {addingParticipant === staff.id ? "Adding…" : "Add"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.map((message) => {
            const isFromAdmin = message.sender_id === user.id
            const sender = message.sender

            return (
              <div key={message.id} className={`flex gap-2 sm:gap-3 ${isFromAdmin ? "flex-row-reverse" : "flex-row"}`}>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#D76B1A] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">{sender?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className={`flex-1 max-w-[75%] sm:max-w-[70%] ${isFromAdmin ? "flex flex-col items-end" : ""}`}>
                  <div
                    className={`rounded-2xl p-2.5 sm:p-3 ${
                      isFromAdmin ? "bg-[#D76B1A] text-white" : "bg-white shadow-sm"
                    }`}
                  >
                    <p className={`text-sm ${isFromAdmin ? "text-white" : "text-[#2E2E2E]"}`}>{message.content}</p>

                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((url: string, idx: number) => {
                          const isVideo = url.includes(".mp4") || url.includes(".mov") || url.includes(".webm")
                          return isVideo ? (
                            <video key={idx} src={url} controls className="rounded-lg max-w-full" />
                          ) : (
                            <img
                              key={idx}
                              src={url || "/placeholder.svg"}
                              alt="Attachment"
                              className="rounded-lg max-w-full"
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#2E2E2E]/40">
                      {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isFromAdmin && message.read_at && <span className="text-xs text-[#D76B1A] font-medium">Seen</span>}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input with attachment preview */}
      <div className="bg-white border-t border-[#F7E2BD]/20 px-3 sm:px-4 py-3 sm:py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          {/* Attachment preview */}
          {attachments.length > 0 && (
            <div className="mb-2 flex gap-2 overflow-x-auto pb-2">
              {attachments.map((file, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <div className="w-16 h-16 bg-[#FBF8F4] rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-[#D76B1A]" />
                  </div>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="admin-message-file-upload"
            />
            <label
              htmlFor="admin-message-file-upload"
              className="p-2 hover:bg-[#FBF8F4] rounded-lg transition flex-shrink-0 cursor-pointer"
            >
              <Paperclip className="w-5 h-5 text-[#5A4A42]/60" />
            </label>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              disabled={uploading || sending}
              className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-xl border border-[#F7E2BD] focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/20"
            />
            <button
              onClick={handleSend}
              disabled={(!newMessage.trim() && attachments.length === 0) || uploading || sending}
              className="p-2 bg-[#D76B1A] text-white rounded-xl hover:bg-[#C25A0F] transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {uploading ? "..." : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
