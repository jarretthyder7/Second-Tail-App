'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProtectedRoute } from '@/lib/protected-route'
import { fetchHelpRequests, fetchDogsForOrg } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, ChevronUp, MessageSquare, FileText, Plus, UserCheck, Send, X, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
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
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  // Reply modal state
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  
  // Internal note modal state
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteRequestId, setNoteRequestId] = useState<string | null>(null)
  const [internalNote, setInternalNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

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

  const updateStatus = async (requestId: string, newStatus: string) => {
    setUpdatingId(requestId)
    try {
      const response = await fetch('/api/admin/help-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status: newStatus,
          orgId
        })
      })

      if (response.ok) {
        // Update local state
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: newStatus, resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null }
            : req
        ))
      } else {
        console.error('[v0] Failed to update status')
        alert('Failed to update status. Please try again.')
      }
    } catch (error) {
      console.error('[v0] Error updating status:', error)
      alert('Failed to update status. Please try again.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleReplyToFoster = (request: any) => {
    setReplyingTo(request)
    const dog = request.dog ?? dogs.find((d: any) => d.id === request.dog_id)
    const ticketLink = `${window.location.origin}/org/${orgId}/foster/request-supplies`
    setReplyMessage(`Hi! This is regarding your support request for ${dog?.name || 'your pet'}.\n\nYou can track the status of your request here: ${ticketLink}\n\n`)
    setShowReplyModal(true)
  }

  const sendReplyMessage = async () => {
    if (!replyingTo || !replyMessage.trim()) return
    
    setSendingReply(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('You must be logged in to send messages.')
        return
      }

      const dog = replyingTo.dog ?? dogs.find((d: any) => d.id === replyingTo.dog_id)
      const fosterId = replyingTo.foster_id || replyingTo.foster?.id

      if (!fosterId || !dog?.id) {
        alert('Unable to find foster or dog information.')
        return
      }

      // Check for existing conversation or create one
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('organization_id', orgId)
        .eq('dog_id', dog.id)
        .maybeSingle()

      let conversationId = existingConv?.id

      if (!conversationId) {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            organization_id: orgId,
            dog_id: dog.id,
            recipient_id: fosterId
          })
          .select('id')
          .single()

        if (convError) {
          console.error('[v0] Error creating conversation:', convError)
          throw convError
        }
        conversationId = newConv.id
      }

      // Create the message
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: replyMessage.trim()
        })

      if (msgError) {
        console.error('[v0] Error sending message:', msgError)
        throw msgError
      }

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      alert('Message sent successfully! The foster will see it in their messages.')
      setShowReplyModal(false)
      setReplyingTo(null)
      setReplyMessage('')
    } catch (error) {
      console.error('[v0] Error sending reply:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSendingReply(false)
    }
  }

  const handleAddNote = (requestId: string) => {
    setNoteRequestId(requestId)
    setInternalNote('')
    setShowNoteModal(true)
  }

  const saveInternalNote = async () => {
    if (!noteRequestId || !internalNote.trim()) return

    setSavingNote(true)
    try {
      const response = await fetch('/api/admin/help-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: noteRequestId,
          internalNote: internalNote.trim(),
          orgId
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Update local state with new description
        setRequests(prev => prev.map(req => 
          req.id === noteRequestId 
            ? { ...req, description: data.request?.description || req.description }
            : req
        ))
        alert('Internal note added successfully!')
        setShowNoteModal(false)
        setNoteRequestId(null)
        setInternalNote('')
      } else {
        alert('Failed to add note. Please try again.')
      }
    } catch (error) {
      console.error('[v0] Error saving note:', error)
      alert('Failed to add note. Please try again.')
    } finally {
      setSavingNote(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            Open
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Loader2 className="w-3 h-3" />
            In Progress
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3" />
            Resolved
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
            {status}
          </span>
        )
    }
  }

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
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map(request => {
          const dog = request.dog ?? dogs.find((d: any) => d.id === request.dog_id)
          const foster = request.foster
          const isExpanded = expandedId === request.id
          const isUpdating = updatingId === request.id

          return (
            <div key={request.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-semibold text-[#5A4A42]">{dog?.name || 'Unknown'}</h3>
                      {request.priority && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          request.priority === 'high' ? 'bg-[#D97A68]/10 text-[#D97A68]' :
                          request.priority === 'normal' ? 'bg-[#D76B1A]/10 text-[#D76B1A]' :
                          'bg-[#8FAF99]/10 text-[#8FAF99]'
                        }`}>
                          {request.priority}
                        </span>
                      )}
                      {getStatusBadge(request.status)}
                      {request.team_created && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <UserCheck className="w-3 h-3" />
                          Created by Staff
                        </span>
                      )}
                    </div>
                    {foster && (
                      <p className="text-sm text-[#2E2E2E]/60 mb-1">
                        Foster: {foster.name || foster.email}
                      </p>
                    )}
                    <p className="text-sm text-[#2E2E2E]/70 mb-2">Type: {request.category ?? request.type}</p>
                    <p className="text-sm text-[#2E2E2E]">{request.title || request.description}</p>
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : request.id)}
                    className="p-2 hover:bg-[#FBF8F4] rounded-lg transition"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="pt-4 border-t border-[#F7E2BD] space-y-4">
                    {/* Full description */}
                    {request.description && (
                      <div className="bg-[#FBF8F4] rounded-xl p-3">
                        <p className="text-sm font-medium text-[#5A4A42] mb-1">Description:</p>
                        <p className="text-sm text-[#2E2E2E] whitespace-pre-wrap">{request.description}</p>
                      </div>
                    )}

                    {/* Status Change */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium text-[#5A4A42]">Change Status:</span>
                      {request.status !== 'open' && (
                        <button
                          onClick={() => updateStatus(request.id, 'open')}
                          disabled={isUpdating}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition disabled:opacity-50"
                        >
                          {isUpdating ? '...' : 'Open'}
                        </button>
                      )}
                      {request.status !== 'in_progress' && (
                        <button
                          onClick={() => updateStatus(request.id, 'in_progress')}
                          disabled={isUpdating}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition disabled:opacity-50"
                        >
                          {isUpdating ? '...' : 'In Progress'}
                        </button>
                      )}
                      {request.status !== 'resolved' && (
                        <button
                          onClick={() => updateStatus(request.id, 'resolved')}
                          disabled={isUpdating}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition disabled:opacity-50"
                        >
                          {isUpdating ? '...' : 'Resolved'}
                        </button>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleReplyToFoster(request)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D76B1A] text-white text-sm font-medium hover:bg-[#D76B1A]/90 transition"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Reply to Foster
                      </button>
                      <button 
                        onClick={() => handleAddNote(request.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#F7E2BD] text-[#5A4A42] text-sm font-medium hover:bg-[#FBF8F4] transition"
                      >
                        <FileText className="w-4 h-4" />
                        Add Internal Note
                      </button>
                    </div>

                    {/* Timestamps */}
                    <div className="text-xs text-[#2E2E2E]/50 pt-2">
                      <p>Created: {new Date(request.created_at).toLocaleString()}</p>
                      {request.resolved_at && (
                        <p>Resolved: {new Date(request.resolved_at).toLocaleString()}</p>
                      )}
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

      {/* Reply to Foster Modal */}
      {showReplyModal && replyingTo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-[#F7E2BD]">
              <h3 className="text-lg font-semibold text-[#5A4A42]">Reply to Foster</h3>
              <button
                onClick={() => {
                  setShowReplyModal(false)
                  setReplyingTo(null)
                  setReplyMessage('')
                }}
                className="p-2 hover:bg-[#FBF8F4] rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-[#FBF8F4] rounded-xl p-3">
                <p className="text-sm text-[#5A4A42]">
                  <strong>To:</strong> {replyingTo.foster?.name || replyingTo.foster?.email || 'Foster'}
                </p>
                <p className="text-sm text-[#5A4A42]">
                  <strong>Regarding:</strong> {replyingTo.title || replyingTo.category}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5A4A42] mb-2">Message</label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your message to the foster..."
                  rows={6}
                  className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A] resize-none"
                />
                <p className="text-xs text-[#2E2E2E]/50 mt-1">
                  This message will appear in the foster&apos;s messages inbox.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowReplyModal(false)
                    setReplyingTo(null)
                    setReplyMessage('')
                  }}
                  className="px-4 py-2 rounded-xl border border-[#F7E2BD] text-[#5A4A42] text-sm font-medium hover:bg-[#FBF8F4] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={sendReplyMessage}
                  disabled={sendingReply || !replyMessage.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D76B1A] text-white text-sm font-medium hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
                >
                  {sendingReply ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Internal Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-[#F7E2BD]">
              <h3 className="text-lg font-semibold text-[#5A4A42]">Add Internal Note</h3>
              <button
                onClick={() => {
                  setShowNoteModal(false)
                  setNoteRequestId(null)
                  setInternalNote('')
                }}
                className="p-2 hover:bg-[#FBF8F4] rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-sm text-amber-800">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Internal notes are only visible to staff members, not fosters.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5A4A42] mb-2">Note</label>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Add an internal note about this request..."
                  rows={4}
                  className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A] resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowNoteModal(false)
                    setNoteRequestId(null)
                    setInternalNote('')
                  }}
                  className="px-4 py-2 rounded-xl border border-[#F7E2BD] text-[#5A4A42] text-sm font-medium hover:bg-[#FBF8F4] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveInternalNote}
                  disabled={savingNote || !internalNote.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D76B1A] text-white text-sm font-medium hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
                >
                  {savingNote ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Save Note
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
