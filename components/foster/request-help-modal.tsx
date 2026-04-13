"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Phone, AlertTriangle, MessageSquare, X, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react"

interface RequestHelpModalProps {
  dog: any
  onClose: () => void
  initialView?: "menu" | "call" | "supplies" | "emergency"
}

export function RequestHelpModal({ dog, onClose, initialView = "menu" }: RequestHelpModalProps) {
  const params = useParams()
  const orgId = params.orgId as string

  const [settings, setSettings] = useState<any>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"contacts" | "submit">("contacts")
  
  // Help ticket form state
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`/api/admin/help-settings?orgId=${orgId}`)
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("Failed to fetch help settings:", error)
      } finally {
        setSettingsLoading(false)
      }
    }

    fetchSettings()
  }, [orgId])

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
          type: "general",
          dogId: dog?.id,
          dogName: dog?.name,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit help request")
      }

      setSubmitStatus("success")
      setMessage("")
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err: any) {
      setSubmitStatus("error")
      setSubmitError(err.message)
      console.error("Error submitting help request:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (settingsLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-4 border-[#D76B1A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#5A4A42]">Loading support options...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#D76B1A] to-[#E8854A] px-6 py-5 flex items-start justify-between">
          <div className="text-white">
            <h3 className="text-xl font-bold">Need Help?</h3>
            {dog && <p className="text-sm text-white/80 mt-1">For {dog.name}</p>}
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white transition p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#F7E2BD]">
          <button
            onClick={() => setActiveTab("contacts")}
            className={`flex-1 py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "contacts"
                ? "text-[#D76B1A] border-b-2 border-[#D76B1A] bg-[#D76B1A]/5"
                : "text-[#5A4A42]/60 hover:text-[#5A4A42]"
            }`}
          >
            <Phone className="w-4 h-4" />
            Contact Numbers
          </button>
          <button
            onClick={() => setActiveTab("submit")}
            className={`flex-1 py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "submit"
                ? "text-[#D76B1A] border-b-2 border-[#D76B1A] bg-[#D76B1A]/5"
                : "text-[#5A4A42]/60 hover:text-[#5A4A42]"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Submit Request
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Contacts Tab */}
          {activeTab === "contacts" && (
            <div className="space-y-4">
              {/* Emergency Line */}
              {settings?.emergency_phone && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-red-700">Life-Threatening Emergency</h4>
                      <p className="text-sm text-red-600 mb-3">For immediate emergencies requiring urgent attention</p>
                      <div className="bg-white p-3 rounded-lg border border-red-200 mb-3">
                        <p className="text-xs text-red-500 font-semibold uppercase tracking-wide mb-1">Emergency Line</p>
                        <p className="text-xl font-bold text-red-600 font-mono">{settings.emergency_phone}</p>
                      </div>
                      <a
                        href={`tel:${settings.emergency_phone}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors text-sm"
                      >
                        <Phone className="w-4 h-4" />
                        Call Now
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Support Line */}
              {settings?.contact_phone && (
                <div className="bg-[#F7E2BD]/30 border-2 border-[#F7E2BD] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#D76B1A] rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[#5A4A42]">Foster Support Line</h4>
                      <p className="text-sm text-[#5A4A42]/70 mb-3">For non-emergency help and general support</p>
                      <div className="bg-white p-3 rounded-lg border border-[#F7E2BD] mb-3">
                        <p className="text-xs text-[#D76B1A] font-semibold uppercase tracking-wide mb-1">Support Line</p>
                        <p className="text-xl font-bold text-[#5A4A42] font-mono">{settings.contact_phone}</p>
                      </div>
                      
                      {/* Hours of Operation */}
                      {settings?.hours_of_operation && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Hours of Operation</p>
                          </div>
                          <p className="text-sm text-blue-900 whitespace-pre-wrap">{settings.hours_of_operation}</p>
                        </div>
                      )}
                      
                      <a
                        href={`tel:${settings.contact_phone}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D76B1A] text-white font-semibold hover:bg-[#D76B1A]/90 transition-colors text-sm"
                      >
                        <Phone className="w-4 h-4" />
                        Call Now
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {!settings?.emergency_phone && !settings?.contact_phone && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-1">Contact information not configured</h4>
                    <p className="text-sm text-yellow-800">Your rescue has not set up contact numbers yet. Please submit a help request using the form instead.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Request Tab */}
          {activeTab === "submit" && (
            <div className="space-y-4">
              <div className="mb-4">
                <h4 className="text-lg font-bold text-[#5A4A42] mb-1">Submit a Help Request</h4>
                <p className="text-sm text-[#5A4A42]/70">
                  Describe your issue below. We&apos;ll email your rescue and add this to your messages for easy tracking.
                </p>
              </div>

              {submitStatus === "success" && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">Request submitted successfully!</p>
                    <p className="text-sm text-green-800">Our team has been notified and will respond shortly.</p>
                  </div>
                </div>
              )}

              {submitStatus === "error" && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Failed to submit request</p>
                    <p className="text-sm text-red-800">{submitError}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#5A4A42] mb-2">
                  How can we help?
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe what you need help with..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#F7E2BD] focus:outline-none focus:ring-2 focus:ring-[#D76B1A] focus:border-[#D76B1A] resize-none text-[#2E2E2E]"
                  disabled={isSubmitting || submitStatus === "success"}
                />
                <p className="text-xs text-[#5A4A42]/60 mt-2">
                  {message.length} characters
                </p>
              </div>

              <button
                onClick={handleSubmitHelpRequest}
                disabled={isSubmitting || !message.trim() || submitStatus === "success"}
                className="w-full py-3 px-4 rounded-xl bg-[#D76B1A] text-white font-semibold hover:bg-[#D76B1A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : submitStatus === "success" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Submitted!
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Submit Help Request
                  </>
                )}
              </button>

              <p className="text-xs text-center text-[#5A4A42]/60">
                For life-threatening emergencies, call {settings?.emergency_phone || "your emergency line"} immediately.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RequestHelpModal
