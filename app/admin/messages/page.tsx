'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { Header } from '@/components/header'
import { AdminNav } from '@/components/admin/admin-nav'
import { mockDogs, getMessagesForDog, sendMessage } from '@/lib/mock-data'
import { getCurrentUser } from '@/lib/auth'
import { useState } from 'react'

export default function AdminMessagesPage() {
  const user = getCurrentUser()
  const [selectedDogId, setSelectedDogId] = useState(mockDogs[0]?.id)
  const selectedDog = mockDogs.find(d => d.id === selectedDogId)
  const messages = selectedDog ? getMessagesForDog(selectedDog.id) : []
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<'foster_team' | 'medical_team' | 'adoption_team'>('foster_team')

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !selectedDog) return
    
    setSending(true)
    await sendMessage(selectedDog.id, {
      content: newMessage,
      sender: 'admin',
      senderName: user.name,
      sender_role: selectedTeam,
    })
    setSending(false)
    setNewMessage('')
  }

  const getTeamMessageStyle = (msg: any) => {
    if (msg.sender === 'foster') {
      return 'bg-[#D76B1A] text-white rounded-br-none'
    }
    
    const role = msg.sender_role || 'foster_team'
    
    if (role === 'foster_team') {
      return 'bg-[#F7E2BD] text-[#5A4A42] rounded-bl-none'
    } else if (role === 'medical_team') {
      return 'bg-[#E8EFE6] text-[#5A4A42] rounded-bl-none'
    } else if (role === 'adoption_team') {
      return 'bg-[#5A4A42] text-white rounded-bl-none'
    }
    
    return 'bg-[#F7E2BD] text-[#5A4A42] rounded-bl-none'
  }

  const getTeamLabel = (role?: string) => {
    if (!role) return 'Rescue Team'
    if (role === 'foster_team') return 'Foster Team'
    if (role === 'medical_team') return 'Medical Team'
    if (role === 'adoption_team') return 'Adoption Team'
    return 'Rescue Team'
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Header />
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-[#5A4A42] mb-6">Messages</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
          {/* Conversations List */}
          <div className="card-default overflow-hidden flex flex-col">
            <div className="border-b border-[#F7E2BD] p-4 font-semibold text-[#5A4A42]">
              Conversations
            </div>
            <div className="overflow-y-auto flex-1">
              {mockDogs.map(dog => {
                const dogMessages = getMessagesForDog(dog.id)
                return (
                  <button
                    key={dog.id}
                    onClick={() => setSelectedDogId(dog.id)}
                    className={`w-full text-left px-4 py-3 border-b border-[#F7E2BD]/50 hover:bg-[#FBF8F4] transition-colors ${
                      selectedDogId === dog.id ? 'bg-[#D76B1A]/10 border-l-4 border-l-[#D76B1A]' : ''
                    }`}
                  >
                    <p className="font-semibold text-[#5A4A42]">{dog.name}</p>
                    <p className="text-xs text-[#2E2E2E]/70 truncate">
                      {dogMessages[dogMessages.length - 1]?.content || 'No messages'}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Chat Area */}
          {selectedDog && (
            <div className="lg:col-span-2 card-default flex flex-col">
              <div className="border-b border-[#F7E2BD] p-4">
                <p className="font-semibold text-[#5A4A42]">{selectedDog.name}</p>
                <p className="text-sm text-[#2E2E2E]/70">Foster: {selectedDog.fosterName}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${getTeamMessageStyle(msg)}`}>
                      <p className="text-xs font-semibold opacity-75 mb-1">
                        {msg.sender === 'foster' ? msg.senderName : `${msg.senderName} • ${getTeamLabel(msg.sender_role)}`}
                      </p>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-60 mt-1">{msg.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#F7E2BD] p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#5A4A42] mb-2">
                    Reply as:
                  </label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value as any)}
                    className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]"
                  >
                    <option value="foster_team">Foster Team</option>
                    <option value="medical_team">Medical Team</option>
                    <option value="adoption_team">Adoption Team</option>
                  </select>
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
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
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  )
}
