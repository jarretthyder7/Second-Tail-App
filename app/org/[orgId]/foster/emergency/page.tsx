"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getOrganization } from "@/lib/supabase/queries"
import Link from "next/link"
import { AlertCircle, Phone, MessageSquare, Clock, Heart, ExternalLink } from "lucide-react"

export default function EmergencyHelpPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const [organization, setOrganization] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setProfile(profileData)

        if (profileData?.organization_id) {
          const orgData = await getOrganization(profileData.organization_id)
          setOrganization(orgData)
        }
      }
      setIsLoading(false)
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-bark font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  const hasOrgConnection = !!profile?.organization_id

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary-bark">Emergency Help</h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">Quick access to help when you need it most</p>
      </div>

      {/* Connected Organization Emergency Contact */}
      {hasOrgConnection && organization && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 md:p-8 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-red-900 mb-2">Contact {organization.name}</h2>
              <p className="text-red-800 mb-4">
                Your connected rescue organization. They know you and your foster dog best.
              </p>

              <div className="space-y-3">
                {organization.phone && (
                  <a
                    href={`tel:${organization.phone}`}
                    className="flex items-center gap-3 bg-white rounded-xl p-4 hover:shadow-md transition group"
                  >
                    <Phone className="w-5 h-5 text-red-600 group-hover:scale-110 transition" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-red-900">Call Emergency Line</div>
                      <div className="text-sm text-red-700">{organization.phone}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-red-600" />
                  </a>
                )}

                <Link
                  href={`/org/${orgId}/foster/messages?new=true&urgent=true`}
                  className="flex items-center gap-3 bg-white rounded-xl p-4 hover:shadow-md transition group"
                >
                  <MessageSquare className="w-5 h-5 text-red-600 group-hover:scale-110 transition" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-900">Send Urgent Message</div>
                    <div className="text-sm text-red-700">Team will be notified immediately</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-red-600" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General Emergency Guidance */}
      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
        <h2 className="text-2xl font-bold text-primary-bark">Emergency Situations</h2>

        <div className="space-y-4">
          {/* Medical Emergency */}
          <div className="border-l-4 border-red-600 bg-red-50 p-4 space-y-2">
            <h3 className="font-semibold text-red-900">Medical Emergency</h3>
            <p className="text-sm text-red-800">
              If your foster dog is injured, having trouble breathing, bleeding heavily, or showing signs of distress:
            </p>
            <ul className="text-sm text-red-800 space-y-1 ml-4">
              <li>• Call your rescue organization immediately</li>
              <li>• Go to the nearest emergency vet clinic</li>
              <li>• Keep the dog calm and comfortable</li>
            </ul>
          </div>

          {/* Behavioral Crisis */}
          <div className="border-l-4 border-orange-500 bg-orange-50 p-4 space-y-2">
            <h3 className="font-semibold text-orange-900">Behavioral Crisis</h3>
            <p className="text-sm text-orange-800">
              If your foster dog is showing aggressive behavior, severe anxiety, or you feel unsafe:
            </p>
            <ul className="text-sm text-orange-800 space-y-1 ml-4">
              <li>• Separate the dog to a safe, quiet space</li>
              <li>• Contact your rescue coordinator</li>
              <li>• Don't attempt to handle the dog if you feel unsafe</li>
            </ul>
          </div>

          {/* Can't Continue Fostering */}
          <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 space-y-2">
            <h3 className="font-semibold text-yellow-900">Can't Continue Fostering</h3>
            <p className="text-sm text-yellow-800">If an unexpected situation means you can no longer foster:</p>
            <ul className="text-sm text-yellow-800 space-y-1 ml-4">
              <li>• Contact your rescue organization as soon as possible</li>
              <li>• They'll work with you to find a solution</li>
              <li>• It's okay - they understand emergencies happen</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 24/7 Resources */}
      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
        <h2 className="text-2xl font-bold text-primary-bark">24/7 Emergency Resources</h2>

        <div className="space-y-3">
          <a
            href="tel:888-426-4435"
            className="flex items-center gap-3 border-2 border-primary-bark rounded-xl p-4 hover:bg-neutral-cream transition"
          >
            <Clock className="w-5 h-5 text-primary-bark" />
            <div className="flex-1">
              <div className="text-sm font-medium text-primary-bark">Pet Poison Helpline</div>
              <div className="text-sm text-text-muted">888-426-4435 (fee may apply)</div>
            </div>
          </a>

          <a
            href="https://www.aspca.org/pet-care/animal-poison-control"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 border-2 border-primary-bark rounded-xl p-4 hover:bg-neutral-cream transition"
          >
            <ExternalLink className="w-5 h-5 text-primary-bark" />
            <div className="flex-1">
              <div className="text-sm font-medium text-primary-bark">ASPCA Poison Control</div>
              <div className="text-sm text-text-muted">24/7 emergency assistance</div>
            </div>
          </a>
        </div>
      </div>

      {/* Not Connected to Organization */}
      {!hasOrgConnection && (
        <div className="bg-neutral-cream rounded-2xl p-6 text-center space-y-4">
          <p className="text-text-muted">
            You're not currently connected with a rescue organization. Connect with one to get dedicated emergency
            support.
          </p>
          <Link
            href="/foster/explore"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-orange px-6 py-3 text-sm font-semibold text-white hover:bg-primary-orange/90 transition"
          >
            Explore Rescues
          </Link>
        </div>
      )}
    </main>
  )
}
