"use client"
import { useState, useEffect } from "react"
import { Phone, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useParams } from "next/navigation"

interface CallTeamModalProps {
  organizationId: string
  onClose: () => void
}

export function CallTeamModal({ organizationId, onClose }: CallTeamModalProps) {
  const params = useParams()
  const orgId = (params.orgId as string) || organizationId
  const [teams, setTeams] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()

        // Fetch teams for this organization
        const { data: teamsData } = await supabase
          .from("teams")
          .select("id, name, phone_number")
          .eq("organization_id", orgId)

        // Fetch help settings for phone numbers
        const response = await fetch(`/api/admin/help-settings?orgId=${orgId}`)
        if (response.ok) {
          const settingsData = await response.json()
          setSettings(settingsData)
        }

        setTeams(teamsData || [])
      } catch (error) {
        // Failed to fetch teams
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [orgId])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-4 border-primary-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teams...</p>
        </div>
      </div>
    )
  }

  const contactPhone = settings?.contact_phone || "555-0100"

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Call Support</h3>
            <p className="text-sm text-gray-600">Select a team to call</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {teams.length > 0 ? (
            teams.map((team) => (
              <a
                key={team.id}
                href={`tel:${team.phone_number || contactPhone}`}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-primary-orange hover:bg-orange-50 transition"
              >
                <div className="w-12 h-12 rounded-full bg-primary-orange/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-primary-orange" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{team.name}</h4>
                  <p className="text-sm text-gray-600">{team.phone_number || contactPhone}</p>
                </div>
              </a>
            ))
          ) : (
            <div className="text-center py-8">
              <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No team phone numbers configured yet.</p>
              <a
                href={`tel:${contactPhone}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-orange text-white rounded-lg hover:bg-primary-orange/90 transition"
              >
                <Phone className="w-4 h-4" />
                Call Main Line
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
