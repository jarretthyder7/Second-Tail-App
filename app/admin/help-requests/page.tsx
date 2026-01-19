"use client"

import { ProtectedRoute } from "@/lib/protected-route"
import { Header } from "@/components/header"
import { AdminNav } from "@/components/admin/admin-nav"
import {
  fetchHelpRequests,
  mockDogs,
  mockTeams,
  resolveHelpRequest,
  addJourneyEvent,
  assignHelpRequestToTeam,
  addInternalNoteToHelpRequest,
} from "@/lib/mock-data"
import { useState, useEffect } from "react"
import type { HelpRequest } from "@/lib/mock-data"
import Link from "next/link"

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

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
)

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

export default function HelpRequestsPage() {
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<
    "all" | "supplies" | "emergency" | "medical" | "behavior" | "appointment" | "other"
  >("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in-progress" | "resolved">("all")
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "normal" | "high">("all")
  const [teamFilter, setTeamFilter] = useState<"all" | string>("all")

  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)
  const [internalNote, setInternalNote] = useState("")
  const [addingNote, setAddingNote] = useState(false)

  useEffect(() => {
    fetchHelpRequests().then((data) => {
      setHelpRequests(data)
      setLoading(false)
    })
  }, [])

  const filteredRequests = helpRequests.filter((req) => {
    const typeMatch = typeFilter === "all" || req.type === typeFilter
    const statusMatch = statusFilter === "all" || req.status === statusFilter
    const priorityMatch = priorityFilter === "all" || req.priority === priorityFilter
    const teamMatch = teamFilter === "all" || req.assignedTeam === teamFilter
    return typeMatch && statusMatch && priorityMatch && teamMatch
  })

  const handleResolve = async (requestId: string, dogId: string) => {
    await resolveHelpRequest(requestId)
    await addJourneyEvent(dogId, {
      type: "help-request-resolved",
      title: "Help request resolved",
      description: "Request was successfully resolved by the team",
      timestamp: new Date().toISOString(),
    })

    setHelpRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, status: "resolved" as const, resolvedAt: new Date().toISOString() } : req,
      ),
    )
  }

  const handleAssignTeam = async (requestId: string, teamId: string, dogId: string) => {
    await assignHelpRequestToTeam(requestId, teamId)
    const team = mockTeams.find((t) => t.id === teamId)

    await addJourneyEvent(dogId, {
      type: "internal",
      title: `Help request assigned to ${team?.name}`,
      description: `Request was assigned to the ${team?.name} for handling`,
      timestamp: new Date().toISOString(),
      isInternal: true,
    })

    setHelpRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, assignedTeam: teamId, status: "in-progress" as const } : req,
      ),
    )
  }

  const handleAddNote = async (requestId: string, dogId: string) => {
    if (!internalNote.trim()) return

    setAddingNote(true)
    await addInternalNoteToHelpRequest(requestId, internalNote)

    await addJourneyEvent(dogId, {
      type: "internal",
      title: "Internal note added to help request",
      description: internalNote,
      timestamp: new Date().toISOString(),
      isInternal: true,
    })

    setAddingNote(false)
    setInternalNote("")
    setExpandedRequest(null)
  }

  const getPriorityBadge = (priority?: string) => {
    if (priority === "high") return "bg-[#D97A68] text-white"
    if (priority === "normal") return "bg-[#D76B1A]/10 text-[#D76B1A]"
    if (priority === "low") return "bg-[#E8EFE6] text-[#5A4A42]"
    return "bg-[#F7E2BD] text-[#5A4A42]"
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-[#FBF8F4]">
        <Header />
        <AdminNav />

        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#5A4A42] mb-2">Help Request Center</h1>
              <p className="text-sm text-[#2E2E2E]/70">Manage and respond to foster requests</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#5A4A42] mb-1">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                  >
                    <option value="all">All Types</option>
                    <option value="supplies">Supplies</option>
                    <option value="emergency">Emergency</option>
                    <option value="medical">Medical</option>
                    <option value="behavior">Behavior</option>
                    <option value="appointment">Appointment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5A4A42] mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5A4A42] mb-1">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                    className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5A4A42] mb-1">Assigned Team</label>
                  <select
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                  >
                    <option value="all">All Teams</option>
                    {mockTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-[#2E2E2E]/60 text-sm">Loading help requests...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F7E2BD]/60 border-b border-[#F7E2BD]">
                        <th className="text-left px-4 py-3 font-semibold text-[#5A4A42]">Type</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#5A4A42]">Priority</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#5A4A42]">Dog</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#5A4A42] hidden md:table-cell">
                          Foster
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#5A4A42]">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#5A4A42] hidden lg:table-cell">Team</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#5A4A42] hidden xl:table-cell">
                          Created
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#5A4A42]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => {
                        const dog = mockDogs.find((d) => d.id === request.dogId)
                        const assignedTeam = mockTeams.find((t) => t.id === request.assignedTeam)
                        const isExpanded = expandedRequest === request.id

                        return (
                          <>
                            <tr
                              key={request.id}
                              className="border-b border-[#F7E2BD]/40 hover:bg-[#FBF8F4] transition-colors"
                            >
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-[#F7E2BD] text-[#5A4A42] capitalize">
                                  {request.type}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold capitalize ${getPriorityBadge(request.priority)}`}
                                >
                                  {request.priority || "normal"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <Link
                                  href={`/admin/dogs/${dog?.id}`}
                                  className="font-semibold text-[#D76B1A] hover:text-[#D76B1A]/80"
                                >
                                  {dog?.name || "Unknown"}
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-[#2E2E2E]/70 hidden md:table-cell">
                                {dog?.fosterName || "Unassigned"}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                                    request.status === "open"
                                      ? "bg-[#D97A68] text-white"
                                      : request.status === "in-progress"
                                        ? "bg-[#D76B1A]/10 text-[#D76B1A]"
                                        : "bg-[#E8EFE6] text-[#5A4A42]"
                                  }`}
                                >
                                  {request.status === "open"
                                    ? "Open"
                                    : request.status === "in-progress"
                                      ? "In Progress"
                                      : "Resolved"}
                                </span>
                              </td>
                              <td className="px-4 py-3 hidden lg:table-cell">
                                {assignedTeam ? (
                                  <span className="text-xs text-[#5A4A42]">{assignedTeam.name}</span>
                                ) : (
                                  <span className="text-xs text-[#2E2E2E]/40">Unassigned</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-[#2E2E2E]/60 text-xs hidden xl:table-cell">
                                {new Date(request.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setExpandedRequest(isExpanded ? null : request.id)}
                                    className="p-1 hover:bg-[#F7E2BD]/40 rounded transition"
                                    title="View Details"
                                  >
                                    <AlertCircleIcon className="w-4 h-4 text-[#5A4A42]" />
                                  </button>
                                  <Link href={`/admin/messages`}>
                                    <button
                                      className="p-1 hover:bg-[#F7E2BD]/40 rounded transition"
                                      title="Reply to Foster"
                                    >
                                      <MessageSquareIcon className="w-4 h-4 text-[#D76B1A]" />
                                    </button>
                                  </Link>
                                  {request.status !== "resolved" && (
                                    <button
                                      onClick={() => handleResolve(request.id, request.dogId)}
                                      className="p-1 hover:bg-[#E8EFE6] rounded transition"
                                      title="Mark Resolved"
                                    >
                                      <CheckCircleIcon className="w-4 h-4 text-[#5A4A42]" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-[#FBF8F4] border-b border-[#F7E2BD]/40">
                                <td colSpan={8} className="px-4 py-4">
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-xs font-semibold text-[#5A4A42] mb-1">Description:</p>
                                      <p className="text-sm text-[#2E2E2E] leading-relaxed">{request.description}</p>
                                    </div>

                                    {request.status !== "resolved" && (
                                      <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-1">
                                          <label className="block text-xs font-medium text-[#5A4A42] mb-1">
                                            Assign to Team:
                                          </label>
                                          <select
                                            value={request.assignedTeam || ""}
                                            onChange={(e) =>
                                              handleAssignTeam(request.id, e.target.value, request.dogId)
                                            }
                                            className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                                          >
                                            <option value="">Select team...</option>
                                            {mockTeams.map((team) => (
                                              <option key={team.id} value={team.id}>
                                                {team.name}
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        <div className="flex-1">
                                          <label className="block text-xs font-medium text-[#5A4A42] mb-1">
                                            Add Internal Note:
                                          </label>
                                          <div className="flex gap-2">
                                            <input
                                              type="text"
                                              value={internalNote}
                                              onChange={(e) => setInternalNote(e.target.value)}
                                              placeholder="Team-only note..."
                                              className="flex-1 rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                                            />
                                            <button
                                              onClick={() => handleAddNote(request.id, request.dogId)}
                                              disabled={addingNote || !internalNote.trim()}
                                              className="px-3 py-2 rounded-xl bg-[#5A4A42] text-white text-xs font-semibold hover:bg-[#5A4A42]/90 transition disabled:opacity-50"
                                            >
                                              <FileTextIcon className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {filteredRequests.length === 0 && !loading && (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <p className="text-[#2E2E2E]/60 text-sm">No help requests match the selected filters</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
