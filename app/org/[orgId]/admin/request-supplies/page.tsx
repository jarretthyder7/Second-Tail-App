"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/lib/protected-route"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Package } from "lucide-react"
import Link from "next/link"

export default function RequestSuppliesPage() {
  return (
    <ProtectedRoute allowedRoles={["rescue"]}>
      <RequestSuppliesContent />
    </ProtectedRoute>
  )
}

function RequestSuppliesContent() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string

  const [formData, setFormData] = useState({
    suppliesNeeded: "",
    quantity: "",
    urgency: "normal",
    notes: "",
    requestedFor: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // TODO: Replace with actual API call
    console.log("[v0] Submitting supplies request:", formData)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSubmitting(false)
    router.push(`/org/${orgId}/admin/dashboard`)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-neutral-clay p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/org/${orgId}/admin/dashboard`}
          className="inline-flex items-center gap-2 text-sm text-primary-bark hover:text-primary-orange transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-orange/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-orange" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-bark">Request Supplies</h1>
              <p className="text-sm text-text-muted">Submit a request for supplies needed</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="suppliesNeeded">Supplies Needed *</Label>
              <Input
                id="suppliesNeeded"
                value={formData.suppliesNeeded}
                onChange={(e) => handleChange("suppliesNeeded", e.target.value)}
                placeholder="e.g., Dog food, leashes, blankets"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity / Details *</Label>
              <Input
                id="quantity"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                placeholder="e.g., 3 bags, 10 units"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level *</Label>
              <select
                id="urgency"
                value={formData.urgency}
                onChange={(e) => handleChange("urgency", e.target.value)}
                className="w-full rounded-lg border border-[color:var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange/30"
                required
              >
                <option value="low">Low - Can wait a week+</option>
                <option value="normal">Normal - Needed within a few days</option>
                <option value="high">High - Needed ASAP</option>
                <option value="emergency">Emergency - Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestedFor">Requested For</Label>
              <Input
                id="requestedFor"
                value={formData.requestedFor}
                onChange={(e) => handleChange("requestedFor", e.target.value)}
                placeholder="Specific dog or general shelter use"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Any additional details or special requirements..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary-orange hover:bg-primary-orange/90"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
