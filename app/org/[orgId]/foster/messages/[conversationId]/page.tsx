"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { put } from "@vercel/blob"

// Inline SVG icons
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const ExternalLink = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
)

const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
)

const PaperclipIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.172 7l-6.586 6.586a2 2 0 102.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

const ImageIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12a2 2 0 012.828 0L20 14m-6-6h.01"
    />
  </svg>
)

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.conversationId as string
  const orgId = params.orgId as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [user, setUser] = useState<any>(null)
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [organization, setOrganization] = useState<any>(null)
  const [dog, setDog] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [newMessage, setNewMessage] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  // Rescue staff in this conversation — primary recipient + any teammates added via picker.
  // Foster sees them in the header so they know exactly who's reachable.
  const [rescueParticipants, setRescueParticipants] = useState<any[]>([])

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
      .channel(`foster-conversation:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const newMsg: any = payload.new
          if (user?.id && newMsg.sender_id === user.id) return
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

      // Get conversation including the primary rescue contact, so we can show the foster
      // exactly who's in the chat with them.
      const { data: conv } = await supabase
        .from("conversations")
        .select(
          "*, dog:dogs(*), organization:organizations(*), recipient:profiles!conversations_recipient_id_fkey(id, name, email, role, org_role)",
        )
        .eq("id", conversationId)
        .single()

      setConversation(conv)
      setOrganization(conv?.organization)
      setDog(conv?.dog)

      // Load any additional rescue staff added to this conversation
      try {
        const partsRes = await fetch(`/api/admin/conversations/${conversationId}/participants`)
        if (partsRes.ok) {
          const partsData = await partsRes.json()
          const list: any[] = []
          if (conv?.recipient && conv.recipient.role === "rescue") {
            list.push(conv.recipient)
          }
          ;(partsData.participants || []).forEach((p: any) => {
            if (p?.user?.id && !list.some((x) => x.id === p.user.id)) {
              list.push(p.user)
            }
          })
          setRescueParticipants(list)
        }
      } catch (err) {
        console.warn("Could not load conversation participants:", err)
      }

      const { data: msgs } = await supabase
        .from("messages")
        .select(
          "*, sender:profiles!messages_sender_id_fkey(id, name, email), read_by_profile:profiles!messages_read_by_fkey(id, name)",
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      setMessages(msgs || [])
      setLoading(false)
    } catch (error) {
      console.error("Error loading conversation:", error)
      setLoading(false)
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
      // recipients (org admins), checks debounce + preferences, and dispatches
      // email (and later push). Don't await — UI shouldn't block on it.
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
    <div className="h-screen flex flex-col bg-[#FBF8F4]">
      {/* Header */}
      <div className="bg-white border-b border-[#F7E2BD]/20 px-3 sm:px-4 py-3 sm:py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href={`/org/${orgId}/foster/messages`}>
              <button className="p-1.5 sm:p-2 hover:bg-[#FBF8F4] rounded-lg transition">
                <ArrowLeftIcon className="w-5 h-5 text-[#5A4A42]" />
              </button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-base sm:text-lg text-[#5A4A42]">{organization?.name || "Rescue Team"}</h1>
              {dog ? (
                <Link
                  href={`/org/${orgId}/foster/dog/${dog.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-[#D76B1A] hover:text-[#C25E15] hover:underline truncate inline-flex items-center gap-1"
                  title={`Open ${dog.name}'s profile in a new tab`}
                >
                  About {dog.name}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </Link>
              ) : (
                <p className="text-xs sm:text-sm text-[#2E2E2E]/60 truncate">General</p>
              )}
              {rescueParticipants.length > 0 && (
                <p className="text-[11px] text-[#5A4A42]/60 mt-1 truncate">
                  With{" "}
                  {rescueParticipants
                    .map((p) => p.name?.split(" ")[0] || p.email?.split("@")[0] || "rescue staff")
                    .join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.map((message) => {
            const isFromFoster = message.sender_id === user.id
            const sender = message.sender

            return (
              <div key={message.id} className={`flex gap-2 sm:gap-3 ${isFromFoster ? "flex-row-reverse" : "flex-row"}`}>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#D76B1A] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">{sender?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className={`flex-1 max-w-[75%] sm:max-w-[70%] ${isFromFoster ? "flex flex-col items-end" : ""}`}>
                  <div
                    className={`rounded-2xl p-2.5 sm:p-3 ${
                      isFromFoster ? "bg-[#D76B1A] text-white" : "bg-white shadow-sm"
                    }`}
                  >
                    <p className={`text-sm ${isFromFoster ? "text-white" : "text-[#2E2E2E]"}`}>{message.content}</p>

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
                    {isFromFoster && message.read_at && (
                      <span className="text-xs text-[#D76B1A] font-medium">Seen</span>
                    )}
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
                    <XIcon className="w-3 h-3" />
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
              id="message-file-upload"
            />
            <label
              htmlFor="message-file-upload"
              className="p-2 hover:bg-[#FBF8F4] rounded-lg transition flex-shrink-0 cursor-pointer"
            >
              <PaperclipIcon className="w-5 h-5 text-[#5A4A42]/60" />
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
              {uploading ? "..." : <SendIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
