'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProtectedRoute } from '@/lib/protected-route'
import { fetchHelpRequests, fetchDogsForOrg } from '@/lib/supabase/queries'
import { ChevronDown, ChevronUp, MessageSquare, FileText, Plus, UserCheck } from 'lucide-react'
import { CreateTeamSupportModal } from '@/components/admin/create-team-support-modal'

export default function OrgHelpRequestsPage() {
  return (
    <ProtectedRoute allowedRoles={['rescue']}>
      <OrgHelpRequestsContent />
    </ProtectedRoute>
  )
}

function OrgHelpRequestsContent() {
  const params = useParams()
  const orgId = params.orgId as string
  const [requests, setRequests] = useState<any[]>([])
  const [dogs, setDogs] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadData = async () => {
    const [requestsData, dogsData] = await Promise.all([
      fetchHelpRequests(orgId),
      fetchDogsForOrg(orgId)
    ])
    setRequests(requestsData)
    setDogs(dogsData)
  }

  useEffect(() => {
    loadData()
  }, [orgId])

  const filteredRequests = requests.filter(req => {
    if (priorityFilter !== 'all' && req.priority !== priorityFilter) return false
    if (statusFilter !== 'all' && req.status !== statusFilter) return false
    return true
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#5A4A42] mb-1">Support Requests</h1>
          <p className="text-sm text-[#2E2E2E]/70">Manage foster support requests</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-orange text-white rounded-xl font-medium hover:bg-primary-orange/90 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Support Request
        </button>
      </div>

      <CreateTeamSupportModal
        orgId={orgId}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadData()
        }}
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex gap-4">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="normal">Normal Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map(request => {
          const dog = request.dog ?? dogs.find((d: any) => d.id === request.dog_id)
          const isExpanded = expandedId === request.id

          return (
            <div key={request.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-semibold text-[#5A4A42]">{dog?.name}</h3>
                      {request.priority && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          request.priority === 'high' ? 'bg-[#D97A68]/10 text-[#D97A68]' :
                          request.priority === 'normal' ? 'bg-[#D76B1A]/10 text-[#D76B1A]' :
                          'bg-[#8FAF99]/10 text-[#8FAF99]'
                        }`}>
                          {request.priority}
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === 'open' ? 'bg-[#D76B1A]/10 text-[#D76B1A]' :
                        request.status === 'in-progress' ? 'bg-[#8FAF99]/10 text-[#8FAF99]' :
                        'bg-[#5A4A42]/10 text-[#5A4A42]'
                      }`}>
                        {request.status}
                      </span>
                      {request.team_created && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <UserCheck className="w-3 h-3" />
                          Created by Staff
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#2E2E2E]/70 mb-2">Type: {request.category ?? request.type}</p>
                    <p className="text-sm text-[#2E2E2E]">{request.description}</p>
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : request.id)}
                    className="p-2 hover:bg-[#FBF8F4] rounded-lg transition"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="pt-4 border-t border-[#F7E2BD] space-y-3">
                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D76B1A] text-white text-sm font-medium hover:bg-[#D76B1A]/90 transition">
                        <MessageSquare className="w-4 h-4" />
                        Reply to Foster
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#F7E2BD] text-[#5A4A42] text-sm font-medium hover:bg-[#FBF8F4] transition">
                        <FileText className="w-4 h-4" />
                        Add Internal Note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl">
          <p className="text-[#2E2E2E]/60">No help requests found</p>
        </div>
      )}
    </div>
  )
}
