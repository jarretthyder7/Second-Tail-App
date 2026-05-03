"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Package, Clock, CheckCircle2, Loader2, AlertCircle, Settings, MapPin, Calendar } from "lucide-react"

type SupplyRequest = {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  created_at: string
  pickup_time: string | null
  pickup_location: string | null
  pickup_notes: string | null
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
  // Acknowledge modal state — captures pickup details before sending the foster the email
  const [ackTarget, setAckTarget] = useState<SupplyRequest | null>(null)
  const [ackPickupTime, setAckPickupTime] = useState("")
  const [ackPickupLocation, setAckPickupLocation] = useState("")
  const [ackPickupNotes, setAckPickupNotes] = useState("")
  const [ackError, setAckError] = useState<string | null>(null)
  const [ackSubmitting, setAckSubmitting] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [orgId, filterStatus])

  const loadRequests = async () => {
    setLoading(true)
    const supabase = createClient()

    // Use SELECT * so the query doesn't fail before the pickup_* migration is run.
    // After running scripts/add-pickup-to-help-requests.sql, the new columns flow through
    // automatically via the spread without needing a code change here.
    let query = supabase
      .from("help_requests")
      .select(`
        *,
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

  // Acknowledge submits to the API so the server can stamp acknowledged_by/at AND send the
  // foster a pickup-confirmation email — the direct supabase update above can't send emails.
  const submitAcknowledge = async () => {
    if (!ackTarget) return
    setAckError(null)

    if (!ackPickupTime) {
      setAckError("Pickup time is required so the foster knows when to come.")
      return
    }
    if (!ackPickupLocation.trim()) {
      setAckError("Pickup location is required.")
      return
    }

    setAckSubmitting(true)
    try {
      const res = await fetch("/api/admin/help-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: ackTarget.id,
          orgId,
          status: "in_progress",
          pickupTime: new Date(ackPickupTime).toISOString(),
          pickupLocation: ackPickupLocation.trim(),
          pickupNotes: ackPickupNotes.trim() || null,
        }),
      })
      const result = await res.json().catch(() => ({}))

      if (!res.ok) {
        setAckError(result.error || `Couldn't acknowledge (${res.status})`)
        return
      }

      // Patch local state with the saved row so the UI shows the new pickup info immediately
      const updated: SupplyRequest = {
        ...ackTarget,
        status: "in_progress",
        pickup_time: result.request?.pickup_time ?? new Date(ackPickupTime).toISOString(),
        pickup_location: result.request?.pickup_location ?? ackPickupLocation.trim(),
        pickup_notes: result.request?.pickup_notes ?? (ackPickupNotes.trim() || null),
      }
      setRequests((prev) => prev.map((r) => (r.id === ackTarget.id ? updated : r)))
      setAckTarget(null)
      setAckPickupTime("")
      setAckPickupLocation("")
      setAckPickupNotes("")
    } catch (err) {
      console.error("Acknowledge failed:", err)
      setAckError("Something went wrong. Please try again.")
    } finally {
      setAckSubmitting(false)
    }
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
                  {req.status === "in_progress" && (req.pickup_time || req.pickup_location) && (
                    <div className="mb-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm">
                      <p className="font-semibold text-blue-900 mb-1">Pickup details</p>
                      {req.pickup_time && (
                        <p className="text-blue-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(req.pickup_time).toLocaleString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                      {req.pickup_location && (
                        <p className="text-blue-800 flex items-start gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span className="whitespace-pre-wrap">{req.pickup_location}</span>
                        </p>
                      )}
                      {req.pickup_notes && (
                        <p className="text-blue-700/80 text-xs mt-1 italic whitespace-pre-wrap">
                          {req.pickup_notes}
                        </p>
                      )}
                    </div>
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
                      onClick={() => {
                        setAckTarget(req)
                        setAckPickupTime("")
                        setAckPickupLocation("")
                        setAckPickupNotes("")
                        setAckError(null)
                      }}
                      disabled={updatingId === req.id}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      Acknowledge
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

      {/* Acknowledge → set pickup details modal. Closes on success / cancel.
          Foster gets a pickup-confirmation email automatically when this submits. */}
      <Dialog
        open={!!ackTarget}
        onOpenChange={(open) => {
          if (!open && !ackSubmitting) setAckTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge supply request</DialogTitle>
            <DialogDescription>
              Set when and where the foster should pick up. They'll get an email with these
              details right after you save.
            </DialogDescription>
          </DialogHeader>

          {ackTarget && (
            <div className="space-y-4">
              <div className="p-3 bg-neutral-cream rounded-lg text-sm">
                <p className="font-semibold text-primary-bark">{ackTarget.title}</p>
                <p className="text-text-muted text-xs mt-0.5">
                  {ackTarget.profiles?.name || "Unknown foster"}
                  {ackTarget.dogs?.name ? ` • ${ackTarget.dogs.name}` : ""}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-bark mb-1.5">
                  Pickup time <span className="text-red-600">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={ackPickupTime}
                  onChange={(e) => setAckPickupTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-bark mb-1.5">
                  Pickup location <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={ackPickupLocation}
                  onChange={(e) => setAckPickupLocation(e.target.value)}
                  rows={2}
                  placeholder="Address, building, parking note, etc."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange/40 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-bark mb-1.5">
                  Notes <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  value={ackPickupNotes}
                  onChange={(e) => setAckPickupNotes(e.target.value)}
                  rows={2}
                  placeholder='e.g. "Ring doorbell twice", "Supplies in the porch bin"'
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange/40 resize-none"
                />
              </div>

              {ackError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {ackError}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAckTarget(null)}
              disabled={ackSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitAcknowledge}
              disabled={ackSubmitting}
              className="bg-primary-orange hover:bg-primary-orange-hover text-white"
            >
              {ackSubmitting ? "Acknowledging..." : "Acknowledge & notify foster"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
