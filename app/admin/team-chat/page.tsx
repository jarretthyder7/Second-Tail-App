"use client"

import type React from "react"

import { ProtectedRoute } from "@/lib/protected-route"
import { Header } from "@/components/header"
import { AdminNav } from "@/components/admin/admin-nav"
import {
  mockTeams,
  fetchInternalTeamMessages,
  sendInternalTeamMessage,
  type InternalTeamMessage,
} from "@/lib/mock-data"
import { getCurrentUser } from "@/lib/auth"
import { useState, useEffect } from "react"

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
)

const MessageSquareIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
)

export default function TeamChatPage() {
  const user = getCurrentUser()
  const [selectedTeamId, setSelectedTeamId] = useState(mockTeams[0]?.id)
  const [messages, setMessages] = useState<InternalTeamMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)

  const selectedTeam = mockTeams.find((t) => t.id === selectedTeamId)

  useEffect(() => {
    if (selectedTeamId) {
      fetchInternalTeamMessages(selectedTeamId).then(setMessages)
    }
  }, [selectedTeamId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !selectedTeamId) return

    setSending(true)
    await sendInternalTeamMessage(selectedTeamId, {
      teamId: selectedTeamId,
      senderId: user.id,
      senderName: user.name,
      senderTeam: "Foster Team",
      content: newMessage,
      timestamp: new Date().toISOString(),
    })
    setSending(false)
    setNewMessage("")

    // Refresh messages
    const updatedMessages = await fetchInternalTeamMessages(selectedTeamId)
    setMessages(updatedMessages)
  }

  const getTeamColor = (teamName: string) => {
    if (teamName.includes("Foster")) return "bg-[#F7E2BD] text-[#5A4A42]"
    if (teamName.includes("Medical")) return "bg-[#E8EFE6] text-[#5A4A42]"
    if (teamName.includes("Adoption")) return "bg-[#5A4A42] text-white"
    return "bg-[#F7E2BD] text-[#5A4A42]"
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <Header />
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#5A4A42]">Team Chat</h2>
          <p className="text-sm text-[#2E2E2E]/70 mt-1">Internal communication for rescue staff only</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[600px]">
          {/* Team List Sidebar */}
          <div className="lg:col-span-1 card-default overflow-hidden flex flex-col">
            <div className="border-b border-[#F7E2BD] p-4 flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-[#5A4A42]" />
              <span className="font-semibold text-[#5A4A42]">Teams</span>
            </div>
            <div className="overflow-y-auto flex-1">
              {mockTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`w-full text-left px-4 py-4 border-b border-[#F7E2BD]/50 hover:bg-[#FBF8F4] transition-colors ${
                    selectedTeamId === team.id ? "bg-[#D76B1A]/10 border-l-4 border-l-[#D76B1A]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${getTeamColor(team.name)}`}
                    >
                      <MessageSquareIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#5A4A42] text-sm">{team.name}</p>
                      <p className="text-xs text-[#2E2E2E]/60">{team.members.length} members</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          {selectedTeam && (
            <div className="lg:col-span-3 card-default flex flex-col">
              {/* Header */}
              <div className="border-b border-[#F7E2BD] p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${getTeamColor(selectedTeam.name)}`}
                  >
                    <MessageSquareIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#5A4A42]">{selectedTeam.name}</h3>
                    <p className="text-xs text-[#2E2E2E]/60">Internal team discussion</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedTeam.members.map((member) => (
                    <span
                      key={member.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#F7E2BD] text-[#5A4A42]"
                    >
                      {member.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-[#F7E2BD] rounded-full flex items-center justify-center mb-4">
                      <MessageSquareIcon className="w-8 h-8 text-[#5A4A42]" />
                    </div>
                    <p className="text-sm text-[#2E2E2E]/60">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isCurrentUser = msg.senderId === user?.id
                    return (
                      <div key={msg.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-md px-4 py-3 rounded-xl ${
                            isCurrentUser
                              ? "bg-[#D76B1A] text-white rounded-br-none"
                              : "bg-[#F7E2BD] text-[#5A4A42] rounded-bl-none"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-semibold opacity-75">{msg.senderName}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getTeamColor(msg.senderTeam)}`}>
                              {msg.senderTeam}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className="text-xs opacity-60 mt-2">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="border-t border-[#F7E2BD] p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message to the team..."
                    disabled={sending}
                    className="flex-1 rounded-xl bg-white border border-[#F7E2BD] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D76B1A] text-sm"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-6 py-2 rounded-xl bg-[#D76B1A] text-white font-semibold hover:bg-[#D76B1A]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
                <p className="text-xs text-[#2E2E2E]/50 mt-2">This chat is internal only and not visible to fosters</p>
              </form>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  )
}
