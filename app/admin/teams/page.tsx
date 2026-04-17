'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { Header } from '@/components/header'
import { AdminNav } from '@/components/admin/admin-nav'
import { fetchTeams } from '@/lib/mock-data'
import { useState, useEffect } from 'react'
import type { Team } from '@/lib/mock-data'

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeams().then(data => {
      setTeams(data)
      setLoading(false)
    })
  }, [])

  const getTeamIcon = (type: string) => {
    switch (type) {
      case 'foster':
        return '🏠'
      case 'medical':
        return '⚕️'
      case 'adoption':
        return '❤️'
      case 'operations':
        return '⚙️'
      default:
        return '👥'
    }
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-[#FBF8F4]">
        <Header />
        <AdminNav />

        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#5A4A42] mb-2">Teams</h1>
              <p className="text-sm text-[#2E2E2E]/70">View team members and their roles</p>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <p className="text-[#2E2E2E]/60 text-sm">Loading teams...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {teams.map(team => (
                  <div key={team.id} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#F7E2BD] flex items-center justify-center text-2xl">
                        {getTeamIcon(team.type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#5A4A42]">{team.name}</h3>
                        <p className="text-xs text-[#2E2E2E]/60 capitalize">{team.type} Team</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-[#5A4A42]">Members ({team.members.length})</h4>
                      <div className="space-y-2">
                        {team.members.map(member => (
                          <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl bg-[#FBF8F4]">
                            <div className="w-8 h-8 rounded-full bg-[#F7E2BD] flex items-center justify-center text-xs font-semibold text-[#5A4A42]">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#5A4A42]">{member.name}</p>
                              <p className="text-xs text-[#2E2E2E]/60 truncate">{member.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
