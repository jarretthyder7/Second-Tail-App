"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Package,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Calendar,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

type SupplyRequest = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  created_at: string
  pickup_time: string | null
  pickup_location: string | null
  pickup_notes: string | null
}

const DEFAULT_SUPPLIES = ["Food", "Pee Pads", "Crate", "Toys", "Leash", "Medications", "Other"]

export default function FosterRequestSuppliesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orgId = params.orgId as string
  const shouldOpenNew = searchParams.get("new") === "true"
  const { toast } = useToast()

  const [dogId, setDogId] = useState<string | null>(null)
  const [allowedSupplies, setAllowedSupplies] = useState<string[]>(DEFAULT_SUPPLIES)
  const [requests, setRequests] = useState<SupplyRequest[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [hasAutoOpened, setHasAutoOpened] = useState(false)

  // Form state
  const [selectedSupplies, setSelectedSupplies] = useState<string[]>([])
  const [priority, setPriority] = useState("medium")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const [dogRes, settingsRes, requestsRes] = await Promise.all([
        supabase
          .from("dogs")
          .select("id")
          .eq("foster_id", user.id)
          .eq("organization_id", orgId)
          .limit(1)
          .maybeSingle(),
        fetch(`/api/admin/help-settings?orgId=${orgId}`).then((r) => (r.ok ? r.json() : null)),
        supabase
          .from("help_requests")
          // SELECT * so the foster page works before the pickup_* migration is run.
          // Once the migration adds pickup_time/pickup_location/pickup_notes, the spread
          // picks them up automatically.
          .select("*")
          .eq("foster_id", user.id)
          .eq("organization_id", orgId)
          .eq("category", "supplies")
          .order("created_at", { ascending: false }),
      ])

      if (dogRes.data?.id) setDogId(dogRes.data.id)
      if (settingsRes?.allowed_supply_types?.length) {
        setAllowedSupplies(settingsRes.allowed_supply_types)
      }
      setRequests(requestsRes.data || [])
      setLoadingData(false)
    }
    load()
  }, [orgId])

  // Auto-open form if ?new=true is in URL
  useEffect(() => {
    if (shouldOpenNew && !hasAutoOpened && !loadingData) {
      setShowForm(true)
      setHasAutoOpened(true)
    }
  }, [shouldOpenNew, hasAutoOpened, loadingData])

  const toggleSupply = (supply: string) => {
    setSelectedSupplies((prev) =>
      prev.includes(supply) ? prev.filter((s) => s !== supply) : [...prev, supply]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedSupplies.length === 0) {
      toast({ title: "Please select at least one supply item.", variant: "destructive" })
      return
    }
    setSubmitting(true)

    try {
      const res = await fetch("/api/foster/supply-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          dogId,
          itemName: selectedSupplies.join(", "),
          quantity: selectedSupplies.length,
          urgency: priority,
          notes,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to submit")

      // Optimistically add the new request to the list
      const newRequest: SupplyRequest = {
        id: json.id || crypto.randomUUID(),
        title: `Supply Request: ${selectedSupplies.join(", ")}`,
        description: `Item: ${selectedSupplies.join(", ")}\nQuantity: ${selectedSupplies.length}${notes ? "\n\n" + notes : ""}`,
        status: "open",
        priority,
        created_at: new Date().toISOString(),
      }
      setRequests((prev) => [newRequest, ...prev])

      setSelectedSupplies([])
      setPriority("medium")
      setNotes("")
      setShowForm(false)
      toast({ title: "Supply request submitted!", description: "The rescue team will be in touch soon." })
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    setCancelling(id)
    try {
      const res = await fetch(`/api/foster/supply-requests?id=${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to cancel")
      setRequests((prev) => prev.filter((r) => r.id !== id))
      toast({ title: "Request cancelled", description: "Your supply request has been removed." })
    } catch (err: any) {
      toast({ title: "Could not cancel request", description: err.message, variant: "destructive" })
    } finally {
      setCancelling(null)
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

  const filteredRequests =
    filterStatus === "all"
      ? requests
      : requests.filter((r) => r.status === filterStatus)

  const openCount = requests.filter((r) => r.status === "open").length
  const inProgressCount = requests.filter((r) => r.status === "in_progress").length
  const resolvedCount = requests.filter((r) => r.status === "resolved").length

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/org/${orgId}/foster/dashboard`}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary-bark mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary-orange/10 rounded-lg shrink-0">
            <Package className="w-6 h-6 text-primary-orange" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-primary-bark leading-tight">My Supply Requests</h1>
            <p className="text-sm text-text-muted">Track your requests and submit new ones</p>
          </div>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="w-full bg-primary-orange hover:bg-primary-orange/90 text-white rounded-xl"
        >
          {showForm ? (
            <span className="flex items-center gap-2 justify-center"><X className="w-4 h-4" /> Cancel New Request</span>
          ) : (
            <span className="flex items-center gap-2 justify-center"><Plus className="w-4 h-4" /> New Request</span>
          )}
        </Button>
      </div>

      {/* New request form — slides in when "New Request" is clicked */}
      {showForm && (
        <Card className="mb-8 border-primary-orange/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="w-4 h-4 text-primary-orange" />
              New Supply Request
            </CardTitle>
            <CardDescription>Select what you need and we&apos;ll arrange delivery.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Supply checklist */}
              <div>
                <Label className="text-sm font-medium text-primary-bark mb-3 block">
                  What do you need? <span className="text-red-500">*</span>
                </Label>
                {loadingData ? (
                  <div className="flex items-center gap-2 text-text-muted text-sm py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading options...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allowedSupplies.map((supply) => (
                      <label
                        key={supply}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                          selectedSupplies.includes(supply)
                            ? "border-primary-orange bg-primary-orange/5"
                            : "border-neutral-200 hover:border-primary-orange/40 hover:bg-neutral-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSupplies.includes(supply)}
                          onChange={() => toggleSupply(supply)}
                          className="w-4 h-4 rounded accent-primary-orange"
                        />
                        <span className="text-sm font-medium text-primary-bark">{supply}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Urgency grid */}
              <div>
                <Label className="text-sm font-medium text-primary-bark mb-3 block">Urgency</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "low", label: "Low", desc: "Whenever convenient" },
                    { value: "medium", label: "Normal", desc: "Within a few days" },
                    { value: "high", label: "High", desc: "Needed soon" },
                    { value: "urgent", label: "Urgent", desc: "Need ASAP" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-colors ${
                        priority === opt.value
                          ? "border-primary-orange bg-primary-orange/5"
                          : "border-neutral-200 hover:border-primary-orange/40"
                      }`}
                    >
                      <p className="text-sm font-semibold text-primary-bark">{opt.label}</p>
                      <p className="text-xs text-text-muted">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-primary-bark mb-2 block">
                  Additional Notes
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific details, brands, quantities, or context the rescue team should know..."
                  className="resize-none min-h-[100px] rounded-xl border-neutral-200 focus:border-primary-orange"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || selectedSupplies.length === 0}
                className="w-full bg-primary-orange hover:bg-primary-orange/90 text-white font-semibold py-3 rounded-xl"
              >
                {submitting ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Submit Supply Request"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      {!loadingData && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3">
            <div className="flex flex-col items-center text-center gap-1">
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-lg font-bold text-primary-bark leading-none">{openCount}</p>
              <p className="text-xs text-text-muted">Open</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex flex-col items-center text-center gap-1">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Loader2 className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-primary-bark leading-none">{inProgressCount}</p>
              <p className="text-xs text-text-muted">Sourcing</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex flex-col items-center text-center gap-1">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-lg font-bold text-primary-bark leading-none">{resolvedCount}</p>
              <p className="text-xs text-text-muted">Fulfilled</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filter tabs */}
      <div className="grid grid-cols-4 gap-1.5 mb-6 bg-neutral-100 p-1 rounded-xl">
        {[
          { value: "all", label: "All" },
          { value: "open", label: "Open" },
          { value: "in_progress", label: "Sourcing" },
          { value: "resolved", label: "Done" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(s.value)}
            className={`py-2 rounded-lg font-medium transition text-xs ${
              filterStatus === s.value
                ? "bg-white text-primary-bark shadow-sm"
                : "text-text-muted hover:text-primary-bark"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Request list */}
      {loadingData ? (
        <div className="text-center py-12 text-text-muted">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading your requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-text-muted mb-4" />
          <h3 className="text-xl font-semibold text-primary-bark mb-2">No requests yet</h3>
          <p className="text-text-muted mb-6">
            {filterStatus === "all"
              ? "You haven't submitted any supply requests."
              : "No requests with this status."}
          </p>
          {filterStatus === "all" && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-primary-orange hover:bg-primary-orange/90 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Submit Your First Request
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <Card key={req.id} className="p-4">
              {/* Badges row */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {getStatusBadge(req.status)}
                {getUrgencyBadge(req.priority)}
              </div>
              {/* Title */}
              <h3 className="font-semibold text-primary-bark text-sm leading-snug mb-1">
                {req.title.replace(/^Supply Request:\s*/i, "")}
              </h3>
              {/* Description */}
              {req.description && (
                <p className="text-xs text-text-muted mb-3 line-clamp-2 leading-relaxed">
                  {req.description}
                </p>
              )}
              {/* Pickup details — shown once the rescue acknowledges */}
              {req.status === "in_progress" && (req.pickup_time || req.pickup_location) && (
                <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-900 mb-1.5">Ready for pickup</p>
                  {req.pickup_time && (
                    <p className="text-xs text-blue-800 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
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
                    <p className="text-xs text-blue-800 flex items-start gap-1.5 mt-1">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="whitespace-pre-wrap">{req.pickup_location}</span>
                    </p>
                  )}
                  {req.pickup_notes && (
                    <p className="text-[11px] text-blue-700/80 italic mt-1.5 whitespace-pre-wrap">
                      {req.pickup_notes}
                    </p>
                  )}
                </div>
              )}
              {/* Footer row: date + cancel */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100">
                <p className="text-xs text-text-muted">
                  {new Date(req.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
                {req.status === "open" && (
                  <button
                    onClick={() => handleCancel(req.id)}
                    disabled={cancelling === req.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelling === req.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                    Cancel
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
