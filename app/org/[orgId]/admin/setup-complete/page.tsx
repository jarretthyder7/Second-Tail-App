"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  CheckCircle2,
  Trophy,
  Zap,
  Users,
  Dog,
  Calendar,
  Settings,
  ArrowRight,
  Sparkles,
  HelpCircle,
  X,
} from "lucide-react"

type CompletionSummary = {
  totalStepsCompleted: number
  setupPercentage: number
  organization: {
    name: string
    email: string
    phone: string
  }
  highlights: {
    label: string
    count: number
    icon: React.ComponentType<{ className?: string }>
  }[]
}

export default function SetupCompletePage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const [summary, setSummary] = useState<CompletionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [submittingTicket, setSubmittingTicket] = useState(false)
  const [ticketSubmitted, setTicketSubmitted] = useState(false)

  useEffect(() => {
    loadCompletionSummary()
  }, [orgId])

  const loadCompletionSummary = async () => {
    const supabase = createClient()

    try {
      // Get org info
      const { data: org } = await supabase.from("organizations").select("*").eq("id", orgId).single()

      // Get setup completion
      const { data: completed } = await supabase
        .from("organization_setup_status")
        .select("setup_step_id")
        .eq("organization_id", orgId)
        .eq("is_completed", true)

      // Get quick stats
      const { count: dogCount } = await supabase
        .from("dogs")
        .select("id", { count: "exact" })
        .eq("organization_id", orgId)

      const { count: fosterCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact" })
        .eq("organization_id", orgId)
        .eq("role", "foster")

      setSummary({
        totalStepsCompleted: completed?.length || 0,
        setupPercentage: Math.round(((completed?.length || 0) / 8) * 100),
        organization: {
          name: org?.name || "",
          email: org?.email || "",
          phone: org?.phone || "",
        },
        highlights: [
          { label: "Dogs Added", count: dogCount || 0, icon: Dog },
          { label: "Fosters Invited", count: fosterCount || 0, icon: Users },
          { label: "Setup Completed", count: completed?.length || 0, icon: CheckCircle2 },
        ],
      })
    } catch (error) {
      console.error("[v0] Error loading summary:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitTicket = async (formData: FormData) => {
    setSubmittingTicket(true)
    try {
      const response = await fetch("/api/admin/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          subject: formData.get("subject"),
          message: formData.get("message"),
          category: formData.get("category"),
        }),
      })

      if (!response.ok) throw new Error("Failed to submit ticket")
      setTicketSubmitted(true)
      setTimeout(() => {
        setShowSupportModal(false)
        setTicketSubmitted(false)
      }, 2000)
    } catch (error) {
      console.error("[v0] Error submitting ticket:", error)
      alert("Failed to submit support ticket. Please try again.")
    } finally {
      setSubmittingTicket(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FBF8F4]">
        <div className="text-[#5A4A42]">Loading...</div>
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBF8F4] via-white to-[#F7E2BD]/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Celebration Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Trophy className="w-24 h-24 text-[#D76B1A] animate-bounce" />
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-[#5A4A42] mb-3">Setup Complete!</h1>
          <p className="text-xl text-[#2E2E2E]/70">
            Congratulations, {summary.organization.name}! You're ready to transform your foster program.
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-[#D76B1A]/20 p-8 mb-8">
          {/* Organization Info */}
          <div className="mb-8 pb-8 border-b border-[#F7E2BD]">
            <h2 className="text-sm font-semibold text-[#D76B1A] uppercase tracking-wide mb-4">Organization Profile</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#2E2E2E]/60 mb-1">ORGANIZATION NAME</p>
                <p className="text-lg font-semibold text-[#5A4A42]">{summary.organization.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#2E2E2E]/60 mb-1">EMAIL</p>
                  <p className="text-sm text-[#5A4A42]">{summary.organization.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#2E2E2E]/60 mb-1">PHONE</p>
                  <p className="text-sm text-[#5A4A42]">{summary.organization.phone || "Not configured"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-[#D76B1A] uppercase tracking-wide mb-4">Your Progress</h2>
            <div className="grid grid-cols-3 gap-4">
              {summary.highlights.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="bg-gradient-to-br from-[#D76B1A]/5 to-[#B85A15]/5 rounded-xl p-4 border border-[#F7E2BD]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-[#D76B1A]" />
                      <p className="text-xs font-semibold text-[#2E2E2E]/60">{item.label}</p>
                    </div>
                    <p className="text-3xl font-bold text-[#D76B1A]">{item.count}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-[#FBF8F4] rounded-xl p-6 border-l-4 border-[#D76B1A]">
            <h3 className="font-semibold text-[#5A4A42] mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#D76B1A]" />
              What's Next?
            </h3>
            <ul className="space-y-2 text-sm text-[#5A4A42]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                Invite more fosters to expand your network
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                Add dogs to your care and assign to fosters
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                Create teams and manage your staff
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                Schedule appointments and track care plans
              </li>
            </ul>
          </div>
        </div>

        {/* Feature Showcase */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Foster Communication"
            description="Real-time messaging, appointment scheduling, and instant updates"
            href={`/org/${orgId}/admin/messages`}
          />
          <FeatureCard
            icon={<Dog className="w-6 h-6" />}
            title="Dog Care Management"
            description="Track medical records, feeding schedules, and behavioral notes"
            href={`/org/${orgId}/admin/dogs`}
          />
          <FeatureCard
            icon={<Calendar className="w-6 h-6" />}
            title="Appointment Scheduling"
            description="Coordinate home checks, vet visits, and training sessions"
            href={`/org/${orgId}/admin/appointments`}
          />
          <FeatureCard
            icon={<Settings className="w-6 h-6" />}
            title="Team Management"
            description="Organize staff and manage roles across your organization"
            href={`/org/${orgId}/admin/teams`}
          />
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Link
            href={`/org/${orgId}/admin/dashboard`}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-[#D76B1A] text-white font-semibold rounded-xl hover:bg-[#B85A15] transition shadow-lg"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href={`/org/${orgId}/admin/fosters`}
            className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#D76B1A] text-[#D76B1A] font-semibold rounded-xl hover:bg-[#FBF8F4] transition"
          >
            Invite Fosters
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Need Help Section */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Need Further Assistance?</h3>
          </div>
          <p className="text-sm text-blue-800 mb-4">
            If you have any questions or need help getting started, our support team is here to help.
          </p>
          <button
            onClick={() => setShowSupportModal(true)}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Create Support Ticket
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Support Ticket Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 relative">
              <button
                onClick={() => setShowSupportModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold">Create Support Ticket</h2>
              <p className="text-white/90 text-sm mt-1">We'll respond to your request shortly</p>
            </div>

            {/* Content */}
            <div className="p-6">
              {ticketSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-[#5A4A42] mb-2">Ticket Submitted!</h3>
                  <p className="text-sm text-[#2E2E2E]/70">Thank you for reaching out. We'll be in touch soon.</p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSubmitTicket(new FormData(e.currentTarget))
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-[#5A4A42] mb-2">Category</label>
                    <select
                      name="category"
                      required
                      className="w-full px-4 py-2 border-2 border-[#F7E2BD] rounded-lg focus:border-blue-600 focus:outline-none"
                    >
                      <option value="">Select a category</option>
                      <option value="Technical Issue">Technical Issue</option>
                      <option value="Setup Help">Setup Help</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5A4A42] mb-2">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      required
                      placeholder="Brief description of your issue"
                      className="w-full px-4 py-2 border-2 border-[#F7E2BD] rounded-lg focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#5A4A42] mb-2">Message</label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      placeholder="Please provide details about your request..."
                      className="w-full px-4 py-2 border-2 border-[#F7E2BD] rounded-lg focus:border-blue-600 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowSupportModal(false)}
                      className="flex-1 px-4 py-2 border-2 border-[#D76B1A] text-[#D76B1A] font-medium rounded-lg hover:bg-[#FBF8F4] transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingTicket}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {submittingTicket ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border-2 border-[#F7E2BD] p-6 hover:border-[#D76B1A] hover:shadow-lg transition group"
    >
      <div className="text-[#D76B1A] mb-3 group-hover:scale-110 transition">{icon}</div>
      <h3 className="font-semibold text-[#5A4A42] mb-2">{title}</h3>
      <p className="text-sm text-[#2E2E2E]/70 mb-4">{description}</p>
      <div className="flex items-center gap-1 text-[#D76B1A] font-medium text-sm group-hover:gap-2 transition">
        Get Started <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  )
}
