"use client"

import type React from "react"

import { useState } from "react"

interface MessagesTabProps {
  messages: any[]
  dogId: string
}

export function MessagesTab({ messages = [], dogId }: MessagesTabProps) {
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState<string | "all">("all")

  const safeMessages = Array.isArray(messages) ? messages : []

  const filteredMessages =
    selectedStaffId === "all" ? safeMessages : safeMessages.filter((msg) => msg.sender_user_id === selectedStaffId)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    // Message sending is handled by the parent page via Supabase
    setSending(false)
    setNewMessage("")
  }

  const getTeamMessageStyle = (msg: any) => {
    if (msg.sender === "foster") {
      return "bg-[#D76B1A] text-white rounded-br-none"
    }

    const role = msg.sender_role || "foster_team"

    if (role === "foster_team") {
      return "bg-[#F7E2BD] text-[#5A4A42] rounded-bl-none"
    } else if (role === "medical_team") {
      return "bg-[#E8EFE6] text-[#5A4A42] rounded-bl-none"
    } else if (role === "adoption_team") {
      return "bg-[#5A4A42] text-white rounded-bl-none"
    }

    return "bg-[#F7E2BD] text-[#5A4A42] rounded-bl-none"
  }

  const getTeamLabel = (role?: string) => {
    if (!role) return "Rescue Team"
    if (role === "foster_team") return "Foster Team"
    if (role === "medical_team") return "Medical Team"
    if (role === "adoption_team") return "Adoption Team"
    return "Rescue Team"
  }

  return (
    <div className="space-y-4">
      <div className="card-default p-6 space-y-4 flex flex-col" style={{ height: "600px" }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-[#2E2E2E]/60">
              <p>No messages yet</p>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "foster" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs px-4 py-2 rounded-lg ${getTeamMessageStyle(msg)}`}>
                  <p className="text-xs font-semibold opacity-75 mb-1">
                    {msg.sender === "foster" ? msg.senderName : `${msg.senderName} • ${getTeamLabel(msg.sender_role)}`}
                  </p>
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-60 mt-1">{msg.timestamp}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-[#F7E2BD] pt-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 rounded-lg bg-white border border-[#F7E2BD] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D76B1A] text-sm"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="btn-primary px-4 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  )
}
