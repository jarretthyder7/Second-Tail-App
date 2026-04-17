"use client"

import type React from "react"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, Loader2, CheckCircle2, Mail, Clock, CalendarCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { sendAppointmentRequestConfirmationEmail } from "@/lib/email/send"

export default function RequestAppointmentPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    appointmentType: "",
    preferredDate: "",
    preferredTime: "",
    reason: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to request an appointment.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Build a structured description with all appointment details
      const description = [
        `Appointment Type: ${formData.appointmentType}`,
        `Preferred Date: ${formData.preferredDate}`,
        `Preferred Time: ${formData.preferredTime}`,
        `Reason: ${formData.reason}`,
        formData.notes ? `Notes: ${formData.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n")

      // Insert into help_requests with category = "appointment"
      const { error } = await supabase.from("help_requests").insert({
        organization_id: orgId,
        foster_id: user.id,
        category: "appointment",
        title: `Appointment Request: ${formData.appointmentType}`,
        description,
        status: "open",
        priority: "medium",
      })

      if (error) {
        throw error
      }

      // Get foster's profile info for the confirmation email
      const { data: fosterProfile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .maybeSingle()

      const fosterName = fosterProfile?.name || user.email || "Foster"
      const fosterEmail = fosterProfile?.email || user.email || ""

      // Send confirmation email to foster
      if (fosterEmail) {
        await sendAppointmentRequestConfirmationEmail(
          fosterEmail,
          fosterName.split(" ")[0], // Use first name only
          formData.appointmentType,
          formData.preferredDate,
          formData.preferredTime,
          formData.reason,
        )
      }

      setSubmitted(true)
    } catch (error: any) {
      console.error("Failed to submit appointment request:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to submit your appointment request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Show success screen after successful submission
  if (submitted) {
    const nextSteps = [
      {
        icon: Mail,
        text: "You'll receive an email confirmation shortly",
      },
      {
        icon: Clock,
        text: "Your rescue will review and approve your request — usually within 24 hours",
      },
      {
        icon: CalendarCheck,
        text: "Once confirmed, you'll see it in your Appointments tab",
      },
    ]

    return (
      <div className="min-h-screen bg-background-soft p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-12 pb-10 px-8">
              {/* Checkmark */}
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>

              {/* Headline & subtext */}
              <h2 className="text-3xl font-bold text-primary-bark text-center mb-3">Request Submitted!</h2>
              <p className="text-text-muted text-center leading-relaxed mb-8">
                Your rescue has been notified and will confirm your appointment soon. Here&apos;s what happens next:
              </p>

              {/* Next steps */}
              <div className="space-y-4 mb-10">
                {nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-background border border-border">
                    <div className="w-9 h-9 rounded-lg bg-primary-orange/10 flex items-center justify-center shrink-0 mt-0.5">
                      <step.icon className="w-5 h-5 text-primary-orange" />
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-bold text-primary-orange mt-0.5">{index + 1}.</span>
                      <p className="text-sm text-foreground leading-relaxed">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/org/${orgId}/foster/appointments`} className="flex-1">
                  <Button className="w-full bg-primary-orange hover:bg-primary-orange/90 text-white">
                    <CalendarCheck className="w-4 h-4 mr-2" />
                    View My Appointments
                  </Button>
                </Link>
                <Link href={`/org/${orgId}/foster/dashboard`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <Link
        href={`/org/${orgId}/foster/dashboard`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-accent, #F7E2BD)" }}>
          <Calendar className="w-5 h-5" style={{ color: "var(--brand-primary, #D76B1A)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Request Appointment</h1>
          <p className="text-sm text-gray-500">Schedule a vet visit, check-up, or meeting</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <Label htmlFor="appointmentType" className="text-sm font-semibold text-gray-700 mb-1.5 block">Appointment Type *</Label>
            <select
              id="appointmentType"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              value={formData.appointmentType}
              onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
              required
            >
              <option value="">Select type...</option>
              <option value="vet-checkup">Veterinary Check-up</option>
              <option value="vaccination">Vaccination</option>
              <option value="emergency-vet">Emergency Vet Visit</option>
              <option value="behavioral-consult">Behavioral Consultation</option>
              <option value="grooming">Grooming Appointment</option>
              <option value="training">Training Session</option>
              <option value="foster-meeting">Foster Team Meeting</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="preferredDate" className="text-sm font-semibold text-gray-700 mb-1.5 block">Preferred Date *</Label>
              <Input
                id="preferredDate"
                type="date"
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                className="rounded-xl border-gray-200 py-3"
                required
              />
            </div>
            <div>
              <Label htmlFor="preferredTime" className="text-sm font-semibold text-gray-700 mb-1.5 block">Preferred Time *</Label>
              <Input
                id="preferredTime"
                type="time"
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                className="rounded-xl border-gray-200 py-3"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason" className="text-sm font-semibold text-gray-700 mb-1.5 block">Reason *</Label>
            <Input
              id="reason"
              placeholder="Brief description of why you need this appointment"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="rounded-xl border-gray-200 py-3"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-semibold text-gray-700 mb-1.5 block">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any extra details the rescue team should know..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="rounded-xl border-gray-200 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            style={{ backgroundColor: "var(--brand-primary, #D76B1A)" }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  )
}
