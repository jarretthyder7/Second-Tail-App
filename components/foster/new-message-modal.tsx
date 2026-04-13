"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"

interface NewMessageModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export function NewMessageModal({ onClose, onSuccess }: NewMessageModalProps) {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("")
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [loadingTeams, setLoadingTeams] = useState(true)

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const supabase = createClient()
        const { data: teamsData } = await supabase.from("teams").select("id, name").eq("organization_id", orgId)

        setTeams(teamsData || [])
        if (teamsData && teamsData.length > 0) {
          setSelectedTeam(teamsData[0].id)
        }
      } catch (err) {
        console.error("Failed to load teams:", err)
      } finally {
        setLoadingTeams(false)
      }
    }

    fetchTeams()
  }, [orgId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      setError("Please fill in all fields")
      return
    }

    if (!selectedTeam) {
      setError("Please select a team")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Not authenticated")
        return
      }

      console.log("Creating conversation with team:", selectedTeam)

      // Get foster's first assigned dog to link the conversation
      const { data: fosterDog } = await supabase
        .from("dogs")
        .select("id")
        .eq("foster_id", user.id)
        .eq("organization_id", orgId)
        .limit(1)
        .single()

      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          organization_id: orgId,
          dog_id: fosterDog?.id || null,
          subject: subject,
          team: selectedTeam,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      console.log("Conversation created:", conversation)

      if (convError || !conversation) {
        setError("Failed to create conversation")
        return
      }

      // Add the first message
      const { error: msgError } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content: message,
        created_at: new Date().toISOString(),
      })

      if (msgError) {
        setError("Failed to send message")
        return
      }

      try {
        // Get foster's name
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("id, name")
          .eq("id", user.id)
          .single()

        // Get org admin email to notify them
        const { data: orgAdmin } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("organization_id", orgId)
          .eq("role", "rescue")
          .eq("org_role", "org_admin")
          .limit(1)
          .maybeSingle()

        // Get org name
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
        console.warn("Failed to send message email:", emailError)
      }

      router.push(`/org/${orgId}/foster/messages?conv=${conversation.id}`)
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error("Failed to create message:", err)
      setError("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Message Team</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Select Team</label>
            {loadingTeams ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Loading teams...
              </div>
            ) : teams.length > 0 ? (
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent outline-none"
                disabled={submitting}
              >
                <option value="">Choose a team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                No teams available
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What is this about?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent outline-none"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent outline-none resize-none"
              disabled={submitting}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 transition disabled:opacity-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-orange text-white rounded-lg font-medium hover:bg-primary-orange/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={submitting || !selectedTeam}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
