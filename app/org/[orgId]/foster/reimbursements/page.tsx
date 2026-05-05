"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  Plus, DollarSign, Calendar, FileText, Upload, X,
  Check, Clock, XCircle, CheckCircle2, ArrowLeft, Loader2,
  ChevronRight,
} from "lucide-react"
import { put } from "@vercel/blob"
import { useToast } from "@/hooks/use-toast"

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
  dogs: { name: string } | null
}

const CATEGORIES = [
  { value: "vet_care",   label: "Veterinary Care" },
  { value: "food",       label: "Food & Treats" },
  { value: "supplies",   label: "Supplies" },
  { value: "transport",  label: "Transportation" },
  { value: "grooming",   label: "Grooming" },
  { value: "other",      label: "Other" },
]

export default function ReimbursementsPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const { toast } = useToast()

  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")

  // Form state
  const [selectedDog, setSelectedDog] = useState("")
  const [category, setCategory] = useState("vet_care")
  const [amount, setAmount] = useState("")
  const [expenseDate, setExpenseDate] = useState("")
  const [description, setDescription] = useState("")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  useEffect(() => { loadData() }, [orgId])

  const [orgInfo, setOrgInfo] = useState<{ name: string; email: string | null } | null>(null)

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Deep-link safety: if reimbursements are disabled for this foster (per
    // org default with optional per-foster override), bounce them to the
    // dashboard instead of letting them submit a request that will never be
    // reviewed.
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("reimbursements_enabled")
      .eq("id", user.id)
      .maybeSingle()
    let enabled = true
    if (profileRow?.reimbursements_enabled === true || profileRow?.reimbursements_enabled === false) {
      enabled = profileRow.reimbursements_enabled
    } else {
      const { data: orgSettings } = await supabase
        .from("help_request_settings")
        .select("reimbursements_enabled")
        .eq("organization_id", orgId)
        .maybeSingle()
      enabled = orgSettings?.reimbursements_enabled !== false
    }
    if (!enabled) {
      router.replace(`/org/${orgId}/foster/dashboard`)
      return
    }

    const [dogsRes, reimbRes, orgRes] = await Promise.all([
      supabase.from("dogs").select("id, name").eq("foster_id", user.id).eq("organization_id", orgId),
      supabase.from("reimbursements").select("*, dogs(name)").eq("foster_id", user.id).eq("organization_id", orgId).order("created_at", { ascending: false }),
      supabase.from("organizations").select("name, contact_email").eq("id", orgId).maybeSingle(),
    ])

    setDogs(dogsRes.data || [])
    setReimbursements(reimbRes.data || [])
    if (orgRes.data) {
      setOrgInfo({ name: orgRes.data.name, email: orgRes.data.contact_email })
    }
    setLoading(false)
  }

  const resetForm = () => {
    setSelectedDog("")
    setCategory("vet_care")
    setAmount("")
    setExpenseDate("")
    setDescription("")
    setReceiptFile(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Receipt must be under 10MB.", variant: "destructive" })
      return
    }
    setReceiptFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      let receiptUrl: string | null = null

      if (receiptFile) {
        setUploadingFile(true)
        const blob = await put(`reimbursements/${user.id}/${Date.now()}-${receiptFile.name}`, receiptFile, { access: "public" })
        receiptUrl = blob.url
        setUploadingFile(false)
      }

      const { error } = await supabase.from("reimbursements").insert({
        foster_id: user.id,
        organization_id: orgId,
        dog_id: selectedDog || null,
        amount: parseFloat(amount),
        category,
        expense_date: expenseDate,
        description,
        receipt_url: receiptUrl,
        status: "pending",
      })

      if (error) throw error

      // Notify org admins via central /api/notify (server applies their per-user
      // prefs and fans out push too).
      const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label || category
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: {
            type: "admin.reimbursement_submitted",
            orgId,
            fosterId: user.id,
            amount: parseFloat(amount).toFixed(2),
            category: categoryLabel,
            description,
          },
        }),
      }).catch(() => {}) // silent fail — notification is non-critical

      resetForm()
      setShowForm(false)
      toast({ title: "Request submitted!", description: "Your rescue team will review it soon." })
      loadData()
    } catch (err: any) {
      setUploadingFile(false)
      toast({ title: "Submission failed", description: err.message || "Please try again.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      pending:  { bg: "bg-amber-100",  text: "text-amber-800",  icon: <Clock className="w-3 h-3" />,        label: "Pending Review" },
      approved: { bg: "bg-green-100",  text: "text-green-800",  icon: <Check className="w-3 h-3" />,        label: "Approved" },
      rejected: { bg: "bg-red-100",    text: "text-red-800",    icon: <XCircle className="w-3 h-3" />,      label: "Rejected" },
      paid:     { bg: "bg-blue-100",   text: "text-blue-800",   icon: <CheckCircle2 className="w-3 h-3" />, label: "Paid" },
    }
    const s = styles[status]
    if (!s) return null
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
        {s.icon}
        {s.label}
      </span>
    )
  }

  const getCategoryLabel = (cat: string) =>
    CATEGORIES.find((c) => c.value === cat)?.label || cat

  const pendingCount  = reimbursements.filter((r) => r.status === "pending").length
  const approvedCount = reimbursements.filter((r) => r.status === "approved").length
  const paidCount     = reimbursements.filter((r) => r.status === "paid").length

  const filtered = filterStatus === "all" ? reimbursements : reimbursements.filter((r) => r.status === filterStatus)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

      {/* Back link */}
      <Link
        href={`/org/${orgId}/foster/dashboard`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Page header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-accent, #F7E2BD)" }}>
          <DollarSign className="w-5 h-5" style={{ color: "var(--brand-primary, #D76B1A)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Reimbursements</h1>
          <p className="text-sm text-gray-500">Submit and track your foster expenses</p>
        </div>
      </div>

      {/* New Request button — full width */}
      <button
        onClick={() => { setShowForm((v) => !v); if (showForm) resetForm() }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white mb-6 transition hover:opacity-90"
        style={{ backgroundColor: "var(--brand-primary, #D76B1A)" }}
      >
        {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Request</>}
      </button>

      {/* New request form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">New Reimbursement Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Dog */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Animal (optional)</label>
              <select
                value={selectedDog}
                onChange={(e) => setSelectedDog(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option value="">General Expense</option>
                {dogs.map((dog) => (
                  <option key={dog.id} value={dog.id}>{dog.name}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Amount + Date side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date *</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                  className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="Describe the expense (e.g. emergency vet visit, monthly food supply...)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
              />
            </div>

            {/* Receipt upload — tap friendly */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Receipt (optional)</label>
              {receiptFile ? (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{receiptFile.name}</span>
                  </div>
                  <button type="button" onClick={() => setReceiptFile(null)} className="text-red-500 hover:text-red-600 flex-shrink-0 ml-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 cursor-pointer transition bg-gray-50">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Tap to upload photo or PDF</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, or PDF — max 10MB</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--brand-primary, #D76B1A)" }}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{uploadingFile ? "Uploading receipt..." : "Submitting..."}</>
              ) : "Submit Request"}
            </button>
          </form>
        </div>
      )}

      {/* Stats row */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Pending",  count: pendingCount,  bg: "bg-amber-50",  icon: Clock,         iconColor: "text-amber-600" },
            { label: "Approved", count: approvedCount, bg: "bg-green-50",  icon: Check,         iconColor: "text-green-600" },
            { label: "Paid",     count: paidCount,     bg: "bg-blue-50",   icon: CheckCircle2,  iconColor: "text-blue-600" },
          ].map(({ label, count, bg, icon: Icon, iconColor }) => (
            <div key={label} className={`rounded-xl p-3 ${bg} text-center`}>
              <Icon className={`w-4 h-4 mx-auto mb-1 ${iconColor}`} />
              <p className="text-lg font-bold text-gray-900 leading-none">{count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="grid grid-cols-4 gap-1 mb-5 bg-gray-100 p-1 rounded-xl">
        {[
          { value: "all",      label: "All" },
          { value: "pending",  label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "paid",     label: "Paid" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(s.value)}
            className={`py-2 rounded-lg text-xs font-medium transition ${
              filterStatus === s.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-14">
          <DollarSign className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700 mb-1">No reimbursements yet</p>
          <p className="text-sm text-gray-500">
            {filterStatus === "all" ? "Submit your first expense request above." : "Nothing with this status."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              {/* Top row: amount + badge */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-lg font-bold text-gray-900">${r.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{getCategoryLabel(r.category)}{r.dogs ? ` · ${r.dogs.name}` : ""}</p>
                </div>
                {getStatusBadge(r.status)}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700 leading-relaxed mb-3">{r.description}</p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-2">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(r.expense_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <div className="flex items-center gap-3">
                  {r.payment_date && (
                    <span className="text-xs text-blue-600 font-medium">
                      Paid {new Date(r.payment_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  )}
                  {r.receipt_url && (
                    <a
                      href={r.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium hover:opacity-80 transition"
                      style={{ color: "var(--brand-primary, #D76B1A)" }}
                    >
                      <FileText className="w-3 h-3" />
                      Receipt
                    </a>
                  )}
                </div>
              </div>

              {/* Review notes */}
              {r.review_notes && (
                <div className="mt-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Note from rescue:</p>
                  <p className="text-sm text-gray-700">{r.review_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
