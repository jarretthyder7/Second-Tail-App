"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AlertTriangle, Phone, MessageSquare, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { formatHoursOfOperation } from "@/lib/hours-of-operation"

export default function EmergencyPage() {
  const params = useParams()
  const orgId = params.orgId as string

  const [settings, setSettings] = useState<any>(null)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [activeTab, setActiveTab] = useState<"contacts" | "submit">("contacts")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [orgId])

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/admin/help-settings?orgId=${orgId}`)
      if (!response.ok) throw new Error("Failed to fetch settings")
      const data = await response.json()
      setSettings(data)
    } catch (err) {
      console.error("Error fetching settings:", err)
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const handleSubmitHelpRequest = async () => {
    if (!message.trim()) return

    setIsSubmitting(true)
    setSubmitStatus("idle")
    setSubmitError("")

    try {
      const response = await fetch(`/api/foster/help-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          message: message.trim(),
          type: "emergency",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit help request")
      }

      setSubmitStatus("success")
      setMessage("")
      setTimeout(() => setSubmitStatus("idle"), 3000)
    } catch (err: any) {
      setSubmitStatus("error")
      setSubmitError(err.message)
      console.error("Error submitting help request:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-red-700 font-medium">Loading emergency support...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-red-600 text-white rounded-2xl p-6 md:p-8 mb-8 flex items-start gap-4 shadow-lg">
          <AlertTriangle className="w-8 h-8 flex-shrink-0 mt-0.5" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Emergency Support</h1>
            <p className="text-red-100">
              Need immediate help? Contact our team using the options below.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab("contacts")}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === "contacts"
                ? "bg-red-600 text-white shadow-lg"
                : "bg-white text-red-600 hover:bg-red-50 border-2 border-red-200"
            }`}
          >
            <Phone className="w-4 h-4 inline-block mr-2" />
            Contact Numbers
          </button>
          <button
            onClick={() => setActiveTab("submit")}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === "submit"
                ? "bg-red-600 text-white shadow-lg"
                : "bg-white text-red-600 hover:bg-red-50 border-2 border-red-200"
            }`}
          >
            <MessageSquare className="w-4 h-4 inline-block mr-2" />
            Submit Request
          </button>
        </div>

        {/* Contacts Tab */}
        {activeTab === "contacts" && (
          <div className="space-y-6">
            {/* Emergency Line */}
            {settings?.emergency_phone && (
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md border-l-4 border-red-600">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-red-600 mb-2">Life-Threatening Emergency</h2>
                    <p className="text-[#2E2E2E]/70 mb-4">For immediate emergencies requiring urgent attention</p>
                    <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200 mb-4">
                      <p className="text-xs text-red-600 font-semibold uppercase tracking-wide mb-1">Emergency Line</p>
                      <p className="text-2xl md:text-3xl font-bold text-red-600 font-mono">{settings.emergency_phone}</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${settings.emergency_phone}`}
                    className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-lg"
                  >
                    <Phone className="w-5 h-5" />
                    Call Now
                  </a>
                </div>
              </div>
            )}

            {/* Support Line */}
            {settings?.contact_phone && (
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md border-l-4 border-orange-500">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-orange-600 mb-2">Foster Support Line</h2>
                    <p className="text-[#2E2E2E]/70 mb-4">For non-emergency help and general support</p>
                    <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-200 mb-4">
                      <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1">Support Line</p>
                      <p className="text-2xl md:text-3xl font-bold text-orange-600 font-mono">{settings.contact_phone}</p>
                    </div>
                    {settings?.hours_of_operation && (() => {
                      const formatted = formatHoursOfOperation(settings.hours_of_operation)
                      if (!formatted) return null
                      return (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-4">
                          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-2">Hours of Operation</p>
                          <p className="text-sm text-blue-900 whitespace-pre-wrap">{formatted}</p>
                        </div>
                      )
                    })()}
                  </div>
                  <a
                    href={`tel:${settings.contact_phone}`}
                    className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors shadow-lg"
                  >
                    <Phone className="w-5 h-5" />
                    Call Now
                  </a>
                </div>
              </div>
            )}

            {!settings?.emergency_phone && !settings?.contact_phone && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 flex gap-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">Contact information not yet configured</h3>
                  <p className="text-sm text-yellow-800">Your rescue has not set up emergency contact numbers. Please reach out to your rescue administrator.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Request Tab */}
        {activeTab === "submit" && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#5A4A42] mb-2">Submit a Help Request</h2>
              <p className="text-[#2E2E2E]/70">
                Describe your emergency situation below. We&apos;ll send your request to our team and add it to your chat for tracking.
              </p>
            </div>

            {submitStatus === "success" && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex gap-3 mb-6">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Request submitted successfully</p>
                  <p className="text-sm text-green-800">Our team has been notified and will respond shortly.</p>
                </div>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex gap-3 mb-6">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Failed to submit request</p>
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#5A4A42] mb-3">
                  Describe your emergency
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please provide as much detail as possible about the emergency situation..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#F7E2BD] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-[#2E2E2E]"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-[#2E2E2E]/60 mt-2">
                  {message.length} characters
                </p>
              </div>

              <button
                onClick={handleSubmitHelpRequest}
                disabled={isSubmitting || !message.trim()}
                className="w-full py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Submit Emergency Request
                  </>
                )}
              </button>

              <p className="text-xs text-[#2E2E2E]/60 text-center">
                For life-threatening emergencies, call {settings?.emergency_phone || "your emergency line"} immediately.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
