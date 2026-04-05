"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Package, Clock, CheckCircle2, Loader2, AlertCircle, Settings } from "lucide-react"

type SupplyRequest = {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  created_at: string
  profiles: { name: string } | null
  dogs: { name: string } | null
}

export default function AdminSupplyRequestsPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const router = useRouter()

  const [requests, setRequests] = useState<SupplyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    loadRequests()
  }, [orgId, filterStatus])

  const loadRequests = async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from("help_requests")
      .select(`
        id,
        title,
        description,
        priority,
        status,
        created_at,
        profiles!help_requests_foster_id_fkey(name),
        dogs(name)
      `)
      .eq("category", "supplies")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus)
    }

    const { data } = await query
    setRequests((data as SupplyRequest[]) || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    const supabase = createClient()
    const { error } = await supabase
      .from("help_requests")
      .update({ status: newStatus })
      .eq("id", id)

    if (!error) {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      )
    }
    setUpdatingId(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            Open
          </span>
        )
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Loader2 className="w-3 h-3" />
            Being Sourced
          </span>
        )
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3" />
            Fulfilled
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

  const getUrgencyBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "emergency":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
            <AlertCircle className="w-3 h-3" />
            Urgent
          </span>
        )
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
            High
          </span>
        )
      case "normal":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-600">
            Normal
          </span>
        )
      case "low":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
            Low
          </span>
        )
      default:
        return null
    }
  }

  const openCount = requests.filter((r) => r.status === "open").length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-orange/10 rounded-lg">
              <Package className="w-6 h-6 text-primary-orange" />
            </div>
            <h1 className="text-3xl font-bold text-primary-bark">Supply Requests</h1>
          </div>
          <button
            onClick={() => router.push(`/org/${orgId}/admin/settings/help-requests`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 text-sm font-medium text-text-main hover:bg-neutral-cream transition"
          >
            <Settings className="w-4 h-4" />
            Configure Supply Types
          </button>
        </div>
        <p className="text-text-muted">Manage supply requests submitted by fosters</p>
      </div>

      {/* Open count stat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-bark">{openCount}</p>
              <p className="text-sm text-text-muted">Open Requests</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Loader2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-bark">
                {requests.filter((r) => r.status === "in_progress").length}
              </p>
              <p className="text-sm text-text-muted">Being Sourced</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-bark">
                {requests.filter((r) => r.status === "resolved").length}
              </p>
              <p className="text-sm text-text-muted">Fulfilled</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "open", "in_progress", "resolved"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
              filterStatus === s
                ? "bg-primary-orange text-white"
                : "bg-white text-text-main hover:bg-neutral-cream"
            }`}
          >
            {s === "all" ? "All" : s === "in_progress" ? "Being Sourced" : s === "resolved" ? "Fulfilled" : "Open"}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-text-muted">Loading...</div>
      ) : requests.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-text-muted mb-4" />
          <h3 className="text-xl font-semibold text-primary-bark mb-2">No supply requests found</h3>
          <p className="text-text-muted">There are no supply requests matching your filter</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-primary-bark text-lg">{req.title}</h3>
                    {getStatusBadge(req.status)}
                    {getUrgencyBadge(req.priority)}
                  </div>
                  {req.description && (
                    <p className="text-sm text-text-muted mb-2 line-clamp-2">{req.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-text-muted flex-wrap">
                    <span>{req.profiles?.name || "Unknown Foster"}</span>
                    {req.dogs?.name && (
                      <>
                        <span>•</span>
                        <span>{req.dogs.name}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  {req.status === "open" && (
                    <button
                      onClick={() => updateStatus(req.id, "in_progress")}
                      disabled={updatingId === req.id}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {updatingId === req.id ? "..." : "Acknowledge"}
                    </button>
                  )}
                  {(req.status === "open" || req.status === "in_progress") && (
                    <button
                      onClick={() => updateStatus(req.id, "resolved")}
                      disabled={updatingId === req.id}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {updatingId === req.id ? "..." : "Mark Fulfilled"}
                    </button>
                  )}
                  {req.status === "resolved" && (
                    <button
                      onClick={() => updateStatus(req.id, "open")}
                      disabled={updatingId === req.id}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white border border-neutral-200 text-text-muted hover:bg-neutral-cream transition disabled:opacity-50"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
