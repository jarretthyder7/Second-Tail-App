"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
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
}

const DEFAULT_SUPPLIES = ["Food", "Pee Pads", "Crate", "Toys", "Leash", "Medications", "Other"]

export default function FosterRequestSuppliesPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const { toast } = useToast()

  const [dogId, setDogId] = useState<string | null>(null)
  const [allowedSupplies, setAllowedSupplies] = useState<string[]>(DEFAULT_SUPPLIES)
  const [requests, setRequests] = useState<SupplyRequest[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [selectedSupplies, setSelectedSupplies] = useState<string[]>([])
  const [priority, setPriority] = useState("normal")
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
          .select("id, title, description, status, priority, created_at")
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
      console.log("[v0] supply request response:", res.status, json)
      if (!res.ok) throw new Error(json.error || "Failed to submit")

      if (json.request) {
        setRequests((prev) => [json.request, ...prev])
      }

      setSelectedSupplies([])
      setPriority("normal")
      setNotes("")
      setShowForm(false)
      toast({ title: "Supply request submitted!", description: "The rescue team will be in touch soon." })
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
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
      <div className="mb-8">
        <Link
          href={`/org/${orgId}/foster/dashboard`}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary-bark mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-orange/10 rounded-lg">
              <Package className="w-6 h-6 text-primary-orange" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-bark">My Supply Requests</h1>
              <p className="text-sm text-text-muted">Track your requests and submit new ones</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm((v) => !v)}
            className="bg-primary-orange hover:bg-primary-orange/90 text-white rounded-xl shrink-0"
          >
            {showForm ? (
              <span className="flex items-center gap-2"><X className="w-4 h-4" /> Cancel</span>
            ) : (
              <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> New Request</span>
            )}
          </Button>
        </div>
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
                    { value: "normal", label: "Normal", desc: "Within a few days" },
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
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-primary-bark">{openCount}</p>
                <p className="text-xs text-text-muted">Open</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Loader2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-primary-bark">{inProgressCount}</p>
                <p className="text-xs text-text-muted">Being Sourced</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-primary-bark">{resolvedCount}</p>
                <p className="text-xs text-text-muted">Fulfilled</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "open", "in_progress", "resolved"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
              filterStatus === s
                ? "bg-primary-orange text-white"
                : "bg-white text-text-main hover:bg-neutral-100 border border-neutral-200"
            }`}
          >
            {s === "all"
              ? "All"
              : s === "in_progress"
              ? "Being Sourced"
              : s === "resolved"
              ? "Fulfilled"
              : "Open"}
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
            <Card key={req.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-primary-bark text-base">{req.title}</h3>
                    {getStatusBadge(req.status)}
                    {getUrgencyBadge(req.priority)}
                  </div>
                  {req.description && (
                    <p className="text-sm text-text-muted mb-2 line-clamp-2">{req.description}</p>
                  )}
                  <p className="text-xs text-text-muted">
                    Submitted {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
