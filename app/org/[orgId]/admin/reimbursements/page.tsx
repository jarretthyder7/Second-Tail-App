"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { DollarSign, Check, X, Clock, CheckCircle2, XCircle, FileText, Calendar } from "lucide-react"

type Reimbursement = {
  id: string
  amount: number
  category: string
  expense_date: string
  description: string
  receipt_url: string | null
  status: string
  review_notes: string | null
  payment_date: string | null
  payment_method: string | null
  created_at: string
  profiles: { name: string; email: string } | null
  dogs: { name: string } | null
}

export default function AdminReimbursementsPage() {
  const params = useParams()
  const orgId = params.orgId as string

  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedReimbursement, setSelectedReimbursement] = useState<Reimbursement | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [paymentDate, setPaymentDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadReimbursements()
  }, [orgId, filterStatus])

  const loadReimbursements = async () => {
    const supabase = createClient()

    let query = supabase
      .from("reimbursements")
      .select(`
        *,
        profiles!reimbursements_foster_id_fkey(name, email),
        dogs(name)
      `)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus)
    }

    const { data } = await query
    setReimbursements(data || [])
    setLoading(false)
  }

  const handleApprove = async () => {
    if (!selectedReimbursement) return
    setProcessing(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase
        .from("reimbursements")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq("id", selectedReimbursement.id)

      if (error) throw error

      setSelectedReimbursement(null)
      setReviewNotes("")
      loadReimbursements()
    } catch (error) {
      console.error("Error approving reimbursement:", error)
      alert("Failed to approve reimbursement")
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedReimbursement) return
    setProcessing(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase
        .from("reimbursements")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq("id", selectedReimbursement.id)

      if (error) throw error

      setSelectedReimbursement(null)
      setReviewNotes("")
      loadReimbursements()
    } catch (error) {
      console.error("Error rejecting reimbursement:", error)
      alert("Failed to reject reimbursement")
    } finally {
      setProcessing(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!selectedReimbursement) return
    setProcessing(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("reimbursements")
        .update({
          status: "paid",
          payment_date: paymentDate,
          payment_method: paymentMethod,
        })
        .eq("id", selectedReimbursement.id)

      if (error) throw error

      setSelectedReimbursement(null)
      setPaymentDate("")
      setPaymentMethod("")
      loadReimbursements()
    } catch (error) {
      console.error("Error marking as paid:", error)
      alert("Failed to mark as paid")
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="w-3 h-3" />
            Approved
          </span>
        )
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        )
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle2 className="w-3 h-3" />
            Paid
          </span>
        )
      default:
        return null
    }
  }

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      vet_care: "Veterinary Care",
      food: "Food & Treats",
      supplies: "Supplies",
      transport: "Transportation",
      grooming: "Grooming",
      other: "Other",
    }
    return labels[cat] || cat
  }

  const totalPending = reimbursements.filter((r) => r.status === "pending").length
  const totalApproved = reimbursements.filter((r) => r.status === "approved").length
  const totalAmount = reimbursements
    .filter((r) => r.status === "approved" || r.status === "paid")
    .reduce((sum, r) => sum + r.amount, 0)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-bark mb-2">Reimbursements</h1>
        <p className="text-text-muted">Review and manage foster expense requests</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-bark">{totalPending}</p>
              <p className="text-sm text-text-muted">Pending Review</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-bark">{totalApproved}</p>
              <p className="text-sm text-text-muted">Approved</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-orange/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-primary-orange" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-bark">${totalAmount.toFixed(2)}</p>
              <p className="text-sm text-text-muted">Total Approved</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === "all" ? "bg-primary-orange text-white" : "bg-white text-text-main hover:bg-neutral-cream"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus("pending")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === "pending"
              ? "bg-primary-orange text-white"
              : "bg-white text-text-main hover:bg-neutral-cream"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilterStatus("approved")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === "approved"
              ? "bg-primary-orange text-white"
              : "bg-white text-text-main hover:bg-neutral-cream"
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilterStatus("paid")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === "paid" ? "bg-primary-orange text-white" : "bg-white text-text-main hover:bg-neutral-cream"
          }`}
        >
          Paid
        </button>
      </div>

      {/* Reimbursements List */}
      <div className="space-y-4">
        {reimbursements.length === 0 ? (
          <Card className="p-12 text-center">
            <DollarSign className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-xl font-semibold text-primary-bark mb-2">No reimbursements found</h3>
            <p className="text-text-muted">There are no reimbursement requests matching your filter</p>
          </Card>
        ) : (
          reimbursements.map((reimbursement) => (
            <Card key={reimbursement.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-primary-bark">${reimbursement.amount.toFixed(2)}</h3>
                    {getStatusBadge(reimbursement.status)}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-primary-bark">{reimbursement.profiles?.name || "Unknown Foster"}</p>
                    <div className="flex items-center gap-4 text-sm text-text-muted">
                      <span>{getCategoryLabel(reimbursement.category)}</span>
                      {reimbursement.dogs && <span>• {reimbursement.dogs.name}</span>}
                      <span>• {new Date(reimbursement.expense_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {reimbursement.receipt_url && (
                    <a
                      href={reimbursement.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-neutral-cream rounded-lg transition"
                      title="View Receipt"
                    >
                      <FileText className="w-5 h-5 text-primary-orange" />
                    </a>
                  )}
                  {reimbursement.status === "pending" && (
                    <Button
                      onClick={() => {
                        setSelectedReimbursement(reimbursement)
                        setReviewNotes("")
                      }}
                      size="sm"
                      className="bg-primary-orange hover:bg-[#E07B39]"
                    >
                      Review
                    </Button>
                  )}
                  {reimbursement.status === "approved" && (
                    <Button
                      onClick={() => {
                        setSelectedReimbursement(reimbursement)
                        setPaymentDate(new Date().toISOString().split("T")[0])
                        setPaymentMethod("")
                      }}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark Paid
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-sm text-text-main mb-4">{reimbursement.description}</p>

              {reimbursement.review_notes && (
                <div className="bg-neutral-cream rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-text-muted mb-1">Review Notes:</p>
                  <p className="text-sm text-text-main">{reimbursement.review_notes}</p>
                </div>
              )}

              {reimbursement.payment_date && (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Paid on {new Date(reimbursement.payment_date).toLocaleDateString()}
                    {reimbursement.payment_method && ` via ${reimbursement.payment_method}`}
                  </span>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedReimbursement && selectedReimbursement.status === "pending" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl p-6">
            <h2 className="text-2xl font-bold text-primary-bark mb-6">Review Reimbursement</h2>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-cream rounded-lg">
                <div>
                  <p className="text-xs text-text-muted mb-1">Foster</p>
                  <p className="font-medium">{selectedReimbursement.profiles?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Amount</p>
                  <p className="font-bold text-lg">${selectedReimbursement.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Category</p>
                  <p className="font-medium">{getCategoryLabel(selectedReimbursement.category)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Date</p>
                  <p className="font-medium">{new Date(selectedReimbursement.expense_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-text-muted mb-2">Description:</p>
                <p className="text-sm">{selectedReimbursement.description}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
                <Textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes about your decision..."
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setSelectedReimbursement(null)}>
                Cancel
              </Button>
              <Button onClick={handleReject} disabled={processing} className="bg-red-600 hover:bg-red-700 text-white">
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={processing} className="bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Mark Paid Modal */}
      {selectedReimbursement && selectedReimbursement.status === "approved" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-primary-bark mb-6">Mark as Paid</h2>

            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Input
                  id="paymentMethod"
                  type="text"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="e.g., Check, Venmo, PayPal"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setSelectedReimbursement(null)}>
                Cancel
              </Button>
              <Button onClick={handleMarkPaid} disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm Payment
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
