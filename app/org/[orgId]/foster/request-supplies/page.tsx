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
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Plus,
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
  const [showResolved, setShowResolved] = useState(false)

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
      if (!res.ok) throw new Error(json.error || "Failed to submit")

      if (json.request) {
        setRequests((prev) => [json.request, ...prev])
      }

      setSelectedSupplies([])
      setPriority("normal")
      setNotes("")
      toast({ title: "Supply request submitted!", description: "The rescue team will be in touch soon." })
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const openRequests = requests.filter((r) => r.status !== "resolved")
  const resolvedRequests = requests.filter((r) => r.status === "resolved")

  const priorityBadgeClass: Record<string, string> = {
    low: "bg-green-100 text-green-700",
    normal: "bg-neutral-100 text-neutral-600",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/org/${orgId}/foster/dashboard`}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary-bark mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-orange/10 rounded-lg">
            <Package className="w-6 h-6 text-primary-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-bark">Request Supplies</h1>
            <p className="text-sm text-text-muted">Submit a request to your rescue organization</p>
          </div>
        </div>
      </div>

      {/* Open requests — shown prominently above the form */}
      {!loadingData && openRequests.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Open Requests
              <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
                {openRequests.length}
              </span>
            </CardTitle>
            <CardDescription>The rescue team will fulfil these soon.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {openRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-amber-100 bg-white p-3 flex flex-col gap-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-primary-bark">{req.title}</p>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      req.status === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {req.status === "in_progress" ? (
                      <><Loader2 className="w-3 h-3" />Being Sourced</>
                    ) : (
                      <><Clock className="w-3 h-3" />Open</>
                    )}
                  </span>
                </div>
                {req.description && (
                  <p className="text-xs text-text-muted line-clamp-2">{req.description}</p>
                )}
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-text-muted">
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                  {req.priority && req.priority !== "normal" && (
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        priorityBadgeClass[req.priority] ?? "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {req.priority.charAt(0).toUpperCase() + req.priority.slice(1)} urgency
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* New request form */}
      <Card>
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

            {/* Priority */}
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

      {/* Fulfilled requests — collapsible */}
      {!loadingData && resolvedRequests.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <button
              type="button"
              className="flex items-center justify-between w-full text-left"
              onClick={() => setShowResolved((v) => !v)}
            >
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Fulfilled Requests
                <span className="text-xs font-normal text-text-muted">({resolvedRequests.length})</span>
              </CardTitle>
              {showResolved ? (
                <ChevronUp className="w-4 h-4 text-text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-muted" />
              )}
            </button>
          </CardHeader>
          {showResolved && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {resolvedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-primary-bark">{req.title}</p>
                      <p className="text-xs text-text-muted">{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Fulfilled
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
