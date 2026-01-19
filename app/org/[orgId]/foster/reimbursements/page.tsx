"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, DollarSign, Calendar, FileText, Upload, X, Check, Clock, XCircle, CheckCircle2 } from "lucide-react"
import { put } from "@vercel/blob"

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
  created_at: string
  dogs: { name: string } | null
}

export default function ReimbursementsPage() {
  const params = useParams()
  const orgId = params.orgId as string

  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [selectedDog, setSelectedDog] = useState("")
  const [category, setCategory] = useState("vet_care")
  const [amount, setAmount] = useState("")
  const [expenseDate, setExpenseDate] = useState("")
  const [description, setDescription] = useState("")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [orgId])

  const loadData = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // Load foster's dogs
    const { data: dogsData } = await supabase
      .from("dogs")
      .select("id, name, image_url")
      .eq("foster_id", user.id)
      .eq("organization_id", orgId)

    setDogs(dogsData || [])

    // Load reimbursements
    const { data: reimbursementsData } = await supabase
      .from("reimbursements")
      .select(`
        *,
        dogs(name)
      `)
      .eq("foster_id", user.id)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })

    setReimbursements(reimbursementsData || [])
    setLoading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReceiptFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      let receiptUrl = null

      // Upload receipt if provided
      if (receiptFile) {
        const blob = await put(`reimbursements/${user.id}/${Date.now()}-${receiptFile.name}`, receiptFile, {
          access: "public",
        })
        receiptUrl = blob.url
      }

      // Insert reimbursement
      const { error } = await supabase.from("reimbursements").insert({
        foster_id: user.id,
        organization_id: orgId,
        dog_id: selectedDog || null,
        amount: Number.parseFloat(amount),
        category,
        expense_date: expenseDate,
        description,
        receipt_url: receiptUrl,
        status: "pending",
      })

      if (error) throw error

      // Reset form
      setSelectedDog("")
      setCategory("vet_care")
      setAmount("")
      setExpenseDate("")
      setDescription("")
      setReceiptFile(null)
      setReceiptPreview(null)
      setShowNewForm(false)

      // Reload data
      loadData()
    } catch (error) {
      console.error("Error submitting reimbursement:", error)
      alert("Failed to submit reimbursement. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            Pending Review
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-bark">Reimbursements</h1>
          <p className="text-text-muted mt-1">Submit and track your foster care expenses</p>
        </div>
        <Button onClick={() => setShowNewForm(true)} className="bg-primary-orange hover:bg-[#E07B39]">
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* New Reimbursement Form */}
      {showNewForm && (
        <Card className="p-6 mb-8 border-2 border-primary-orange/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-primary-bark">New Reimbursement Request</h2>
            <button onClick={() => setShowNewForm(false)} className="p-2 hover:bg-neutral-cream rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Dog Selection */}
              <div className="space-y-2">
                <Label htmlFor="dog">Dog (Optional)</Label>
                <select
                  id="dog"
                  value={selectedDog}
                  onChange={(e) => setSelectedDog(e.target.value)}
                  className="w-full px-4 py-2 border border-[color:var(--color-border-soft)] rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                >
                  <option value="">General Expense</option>
                  {dogs.map((dog) => (
                    <option key={dog.id} value={dog.id}>
                      {dog.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-[color:var(--color-border-soft)] rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                >
                  <option value="vet_care">Veterinary Care</option>
                  <option value="food">Food & Treats</option>
                  <option value="supplies">Supplies</option>
                  <option value="transport">Transportation</option>
                  <option value="grooming">Grooming</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="pl-9"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Expense Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Expense Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <Input
                    id="date"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="Please describe the expense (e.g., emergency vet visit for injury, monthly food supply, etc.)"
              />
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt/Invoice (Optional)</Label>
              <div className="border-2 border-dashed border-[color:var(--color-border-soft)] rounded-lg p-6 text-center">
                {receiptPreview ? (
                  <div className="space-y-3">
                    {receiptFile?.type.startsWith("image/") ? (
                      <img
                        src={receiptPreview || "/placeholder.svg"}
                        alt="Receipt"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-primary-bark">
                        <FileText className="w-8 h-8" />
                        <span className="font-medium">{receiptFile?.name}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptFile(null)
                        setReceiptPreview(null)
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label htmlFor="receipt" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto text-text-muted mb-2" />
                    <p className="text-sm text-text-muted mb-1">Click to upload receipt or drag and drop</p>
                    <p className="text-xs text-text-muted">PNG, JPG, or PDF up to 10MB</p>
                    <input
                      id="receipt"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary-orange hover:bg-[#E07B39]">
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Reimbursements List */}
      <div className="space-y-4">
        {reimbursements.length === 0 ? (
          <Card className="p-12 text-center">
            <DollarSign className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-xl font-semibold text-primary-bark mb-2">No reimbursements yet</h3>
            <p className="text-text-muted mb-6">
              Submit your first expense request to get reimbursed for foster care costs
            </p>
            <Button onClick={() => setShowNewForm(true)} className="bg-primary-orange hover:bg-[#E07B39]">
              <Plus className="w-4 h-4 mr-2" />
              Submit Request
            </Button>
          </Card>
        ) : (
          reimbursements.map((reimbursement) => (
            <Card key={reimbursement.id} className="p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-primary-bark">${reimbursement.amount.toFixed(2)}</h3>
                    {getStatusBadge(reimbursement.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <span className="font-medium">{getCategoryLabel(reimbursement.category)}</span>
                    {reimbursement.dogs && <span>• {reimbursement.dogs.name}</span>}
                    <span>• {new Date(reimbursement.expense_date).toLocaleDateString()}</span>
                  </div>
                </div>
                {reimbursement.receipt_url && (
                  <a
                    href={reimbursement.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-orange hover:text-[#E07B39] text-sm font-medium"
                  >
                    View Receipt →
                  </a>
                )}
              </div>

              <p className="text-sm text-text-main mb-4">{reimbursement.description}</p>

              {reimbursement.review_notes && (
                <div className="bg-neutral-cream rounded-lg p-3 mt-4">
                  <p className="text-xs font-semibold text-text-muted mb-1">Review Notes:</p>
                  <p className="text-sm text-text-main">{reimbursement.review_notes}</p>
                </div>
              )}

              {reimbursement.payment_date && (
                <div className="mt-3 text-sm text-text-muted">
                  Paid on {new Date(reimbursement.payment_date).toLocaleDateString()}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
