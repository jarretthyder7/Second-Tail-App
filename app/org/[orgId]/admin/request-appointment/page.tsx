"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/lib/protected-route"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"

export default function RequestAppointmentPage() {
  return (
    <ProtectedRoute allowedRoles={["rescue"]}>
      <RequestAppointmentContent />
    </ProtectedRoute>
  )
}

function RequestAppointmentContent() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string

  const [formData, setFormData] = useState({
    appointmentType: "veterinary",
    dogName: "",
    preferredDate: "",
    preferredTime: "",
    provider: "",
    reason: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // TODO: Replace with actual API call
    console.log("[v0] Submitting appointment request:", formData)

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
              <Calendar className="w-6 h-6 text-primary-orange" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-bark">Request Appointment</h1>
              <p className="text-sm text-text-muted">Schedule a vet visit or consultation</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="appointmentType">Appointment Type *</Label>
              <select
                id="appointmentType"
                value={formData.appointmentType}
                onChange={(e) => handleChange("appointmentType", e.target.value)}
                className="w-full rounded-lg border border-[color:var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange/30"
                required
              >
                <option value="veterinary">Veterinary Checkup</option>
                <option value="emergency">Emergency Vet Visit</option>
                <option value="behavior">Behavior Consultation</option>
                <option value="grooming">Grooming</option>
                <option value="vaccination">Vaccination</option>
                <option value="surgery">Surgery Follow-up</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dogName">Dog Name *</Label>
              <Input
                id="dogName"
                value={formData.dogName}
                onChange={(e) => handleChange("dogName", e.target.value)}
                placeholder="Which dog needs the appointment?"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferredDate">Preferred Date *</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => handleChange("preferredDate", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredTime">Preferred Time</Label>
                <Input
                  id="preferredTime"
                  type="time"
                  value={formData.preferredTime}
                  onChange={(e) => handleChange("preferredTime", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider / Clinic</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => handleChange("provider", e.target.value)}
                placeholder="Preferred vet clinic or provider"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Appointment *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
                placeholder="What is the appointment for?"
                rows={3}
                className="resize-none"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Any special considerations or requirements..."
                rows={3}
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
