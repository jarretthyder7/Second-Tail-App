"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { put } from "@vercel/blob"
import { ArrowLeft, Send, Paperclip, ImageIcon, X } from "lucide-react"

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

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

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

      // Get conversation
      const { data: convs, error: convsError } = await supabase
        .from("conversations")
        .select("*, dog:dogs(*)")
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
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error loading conversation:", error)
      setLoading(false)
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

      // Notify foster via email
      try {
        if (foster?.email) {
          // Get org name
          const { data: org } = await supabase.from("organizations").select("name").eq("id", orgId).single()

          await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "message-to-foster",
              fosterEmail: foster.email,
              fosterName: foster.name,
              orgName: org?.name || "Your rescue organization",
            }),
          })
        }
      } catch (emailError) {
        console.warn("[v0] Failed to send message notification email:", emailError)
      }

      setMessages([...messages, message])
      setNewMessage("")
      setAttachments([])
      setSending(false)

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (error) {
      console.error("[v0] Error sending message:", error)
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

      console.log(`[v0] Marked ${messageIds.length} messages as read`)
    } catch (error) {
      console.error("[v0] Error marking messages as read:", error)
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
                  <span className="bg-[#F7E2BD] text-[#5A4A42] text-xs px-2 py-0.5 rounded-full font-medium">
                    {conversation.team}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#2E2E2E]/60 truncate">{dog ? `About ${dog.name}` : "General"}</p>
            </div>
          </div>
        </div>
      </div>

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
