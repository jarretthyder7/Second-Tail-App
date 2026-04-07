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
    <div className="min-h-screen bg-background-soft p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/org/${orgId}/foster/dashboard`}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary-bark mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary-orange/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-orange" />
              </div>
              <div>
                <CardTitle className="text-2xl">Request Appointment</CardTitle>
                <CardDescription>Schedule a vet visit, check-up, or meeting with the rescue team</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appointmentType">Appointment Type *</Label>
                <select
                  id="appointmentType"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredDate">Preferred Date *</Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredTime">Preferred Time *</Label>
                  <Input
                    id="preferredTime"
                    type="time"
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Appointment *</Label>
                <Input
                  id="reason"
                  placeholder="Brief description of why you need this appointment"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional details about your request..."
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Request
                </Button>
                <Link href={`/org/${orgId}/foster/dashboard`}>
                  <Button type="button" variant="outline" disabled={loading}>
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
