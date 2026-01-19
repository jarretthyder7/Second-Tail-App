"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams } from "next/navigation"
import { X, ArrowRight, CheckCircle2, Zap } from "lucide-react"
import Link from "next/link"

export function FirstTimeSetupModal() {
  const params = useParams()
  const orgId = params.orgId as string
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkIfFirstTime()
  }, [orgId])

  const checkIfFirstTime = async () => {
    const supabase = createClient()

    // Check if organization is brand new (created in last 5 minutes)
    const { data: org } = await supabase.from("organizations").select("created_at").eq("id", orgId).single()

    if (org) {
      const createdTime = new Date(org.created_at).getTime()
      const now = Date.now()
      const fiveMinutesAgo = now - 5 * 60 * 1000

      // Check if org was created recently and show modal
      if (createdTime > fiveMinutesAgo) {
        setShowModal(true)
      }
    }

    setLoading(false)
  }

  if (loading || !showModal) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#D76B1A] to-[#B85A15] text-white p-6 relative">
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Welcome to Second Tail!</h2>
          </div>
          <p className="text-white/90">Let's get your rescue organization set up in minutes.</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Timeline */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#D76B1A] text-white flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <div className="w-1 h-8 bg-[#F7E2BD] my-1"></div>
              </div>
              <div className="pb-8">
                <h3 className="font-semibold text-[#5A4A42]">Complete Your Profile</h3>
                <p className="text-sm text-[#2E2E2E]/70">Add contact info & address</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#D76B1A] text-white flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div className="w-1 h-8 bg-[#F7E2BD] my-1"></div>
              </div>
              <div className="pb-8">
                <h3 className="font-semibold text-[#5A4A42]">Configure Support Options</h3>
                <p className="text-sm text-[#2E2E2E]/70">Set up emergency contact & features</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#D76B1A] text-white flex items-center justify-center font-semibold text-sm">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-[#5A4A42]">Start Coordinating</h3>
                <p className="text-sm text-[#2E2E2E]/70">Add dogs and invite fosters</p>
              </div>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="bg-[#FBF8F4] rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-[#D76B1A] uppercase tracking-wide">What you'll get:</p>
            <div className="space-y-1 text-sm text-[#5A4A42]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                Real-time foster communication
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                Complete care tracking
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                Emergency protocols
              </div>
            </div>
          </div>

          {/* Estimated Time */}
          <p className="text-xs text-center text-[#2E2E2E]/60">Estimated setup time: 15-20 minutes</p>
        </div>

        {/* Actions */}
        <div className="border-t border-[#F7E2BD] p-6 bg-[#FBF8F4] flex gap-3">
          <button
            onClick={() => setShowModal(false)}
            className="flex-1 px-4 py-3 border-2 border-[#D76B1A] text-[#D76B1A] font-semibold rounded-lg hover:bg-[#FBF8F4] transition"
          >
            Skip for Now
          </button>
          <Link
            href={`/org/${orgId}/admin/setup-wizard`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#D76B1A] text-white font-semibold rounded-lg hover:bg-[#B85A15] transition"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
