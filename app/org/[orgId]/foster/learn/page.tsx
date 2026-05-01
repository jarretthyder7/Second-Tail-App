"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  BookOpen,
  Heart,
  Lightbulb,
  MessageCircle,
  Users,
  Award,
  ExternalLink,
  Smartphone,
  Share2,
  MoreVertical,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function LearnPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const [rescueResources, setRescueResources] = useState<any[]>([])
  const [teamsAndStaff, setTeamsAndStaff] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRescueResources = async () => {
      const supabase = createClient()

      const { data: orgData } = await supabase
        .from("organizations")
        .select("branding, teams_and_staff")
        .eq("id", orgId)
        .single()

      if (orgData?.branding?.foster_resources) {
        setRescueResources(orgData.branding.foster_resources)
      }

      if (orgData?.teams_and_staff) {
        setTeamsAndStaff(orgData.teams_and_staff)
      }

      setIsLoading(false)
    }

    fetchRescueResources()
  }, [orgId])

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold text-primary-bark">Foster Resources</h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">
          Everything you need to know about using Second Tail and making a difference
        </p>
      </div>

      {/* Install on Your Phone (PWA) */}
      <div className="rounded-3xl p-8 space-y-6 bg-gradient-to-br from-primary-orange/10 to-primary-orange/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-orange/15 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-primary-orange" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary-bark">Install Second Tail on Your Phone</h2>
            <p className="text-sm text-text-muted">One-tap access from your home screen — no app store needed.</p>
          </div>
        </div>

        <p className="text-sm md:text-base text-text-muted max-w-3xl">
          Second Tail works as an installable app on iPhone and Android. Once installed, it
          opens fullscreen (no browser bar), gets its own home-screen icon, and stays signed in
          so you can update logs, photos, and messages in seconds.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* iOS card */}
          <div className="bg-white rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-primary-orange/10">
              {/* Apple mark */}
              <svg
                viewBox="0 0 16 20"
                className="w-6 h-6 text-primary-bark"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M11.624 0c.066 0 .133 0 .203.005C12.052 1.41 11.55 2.69 10.792 3.6c-.81.974-2.135 1.726-3.41 1.625-.094-1.355.557-2.776 1.275-3.65C9.428.66 10.875.027 11.624 0zM15.27 14.59c-.426.985-.628 1.425-1.176 2.296-.764 1.215-1.84 2.728-3.176 2.74-1.187.012-1.493-.77-3.106-.762-1.612.008-1.95.776-3.137.764-1.336-.012-2.357-1.378-3.121-2.594C-.422 13.652-.65 9.523 1.087 7.32c1.234-1.566 3.18-2.482 4.998-2.482 1.852 0 3.018.94 4.55.94 1.488 0 2.394-.94 4.534-.94.832 0 2.844.073 4.286 2.21-3.768 2.064-3.156 7.45.815 7.542z" />
              </svg>
              <h3 className="text-lg font-semibold text-primary-bark">iPhone (Safari)</h3>
            </div>

            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-orange/10 text-primary-orange font-bold text-sm flex items-center justify-center">
                  1
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-bark">Open Second Tail in Safari</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    It has to be Safari, not Chrome — Apple only allows installs from Safari.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-orange/10 text-primary-orange font-bold text-sm flex items-center justify-center">
                  2
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-bark">Tap the Share button</p>
                  <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>Look for the</span>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 border border-gray-200">
                      <Share2 className="w-3.5 h-3.5 text-primary-bark" />
                    </span>
                    <span>icon at the bottom (or top) of Safari.</span>
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-orange/10 text-primary-orange font-bold text-sm flex items-center justify-center">
                  3
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-bark">Choose "Add to Home Screen"</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Scroll down in the share sheet if you don't see it right away.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-orange/10 text-primary-orange font-bold text-sm flex items-center justify-center">
                  4
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-bark">Tap "Add" — done!</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    The Second Tail icon appears on your home screen like any other app.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Android card */}
          <div className="bg-white rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-primary-orange/10">
              <Smartphone className="w-6 h-6 text-primary-bark" />
              <h3 className="text-lg font-semibold text-primary-bark">Android (Chrome)</h3>
            </div>

            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-orange/10 text-primary-orange font-bold text-sm flex items-center justify-center">
                  1
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-bark">Open Second Tail in Chrome</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    You may see an "Install app" banner at the bottom — if you do, just tap it and skip the next step.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-orange/10 text-primary-orange font-bold text-sm flex items-center justify-center">
                  2
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-bark">Otherwise, tap the menu</p>
                  <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>The</span>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 border border-gray-200">
                      <MoreVertical className="w-3.5 h-3.5 text-primary-bark" />
                    </span>
                    <span>icon in the top-right of Chrome.</span>
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-orange/10 text-primary-orange font-bold text-sm flex items-center justify-center">
                  3
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-bark">
                    Choose "Install app" or "Add to Home screen"
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    The exact wording varies a bit between Android versions.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-orange/10 text-primary-orange font-bold text-sm flex items-center justify-center">
                  4
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-bark">Confirm — done!</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Second Tail will sit alongside your other apps in your launcher.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Heads-up tip */}
        <div className="bg-white/60 rounded-xl p-4 flex gap-3">
          <Lightbulb className="w-5 h-5 text-primary-orange flex-shrink-0 mt-0.5" />
          <div className="text-sm text-text-muted">
            <strong className="text-primary-bark">Heads up:</strong> push notifications from the
            installed app are coming soon. For now, we'll email you whenever there's a new
            message or update from your rescue.
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary-orange/10 to-primary-orange/5 rounded-3xl p-8 space-y-6">
        <h2 className="text-2xl font-bold text-primary-bark">How to Use Second Tail</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary-orange/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary-orange">1</span>
            </div>
            <h3 className="font-semibold text-primary-bark">Dashboard</h3>
            <p className="text-sm text-text-muted">
              View your foster animals, upcoming appointments, and quick actions. Submit daily updates directly from the
              dashboard.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary-orange/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary-orange">2</span>
            </div>
            <h3 className="font-semibold text-primary-bark">Animal Profile</h3>
            <p className="text-sm text-text-muted">
              Click on any animal to see their full profile with medical info, journey timeline, and care instructions.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary-orange/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary-orange">3</span>
            </div>
            <h3 className="font-semibold text-primary-bark">Messages</h3>
            <p className="text-sm text-text-muted">
              Communicate directly with your rescue team. All conversations are organized by animal for easy reference.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary-orange/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary-orange">4</span>
            </div>
            <h3 className="font-semibold text-primary-bark">Daily Updates</h3>
            <p className="text-sm text-text-muted">
              Log daily observations, mood changes, and behavior notes. These help the rescue team monitor progress.
            </p>
          </div>
        </div>
      </div>

      {rescueResources.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-primary-bark">Resources from Your Rescue</h2>
            <span className="px-3 py-1 rounded-full bg-primary-orange/10 text-primary-orange text-sm font-medium">
              {rescueResources.length}
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rescueResources.map((resource: any, index: number) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl p-6 space-y-3 hover:shadow-md transition group"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-primary-bark group-hover:text-primary-orange transition">
                    {resource.title}
                  </h3>
                  <ExternalLink className="w-4 h-4 text-primary-orange flex-shrink-0" />
                </div>
                {resource.description && <p className="text-sm text-text-muted">{resource.description}</p>}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Teams and Staff Members Display */}
      {teamsAndStaff.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-primary-bark">Teams and Staff Members</h2>
            <span className="px-3 py-1 rounded-full bg-primary-orange/10 text-primary-orange text-sm font-medium">
              {teamsAndStaff.length}
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamsAndStaff.map((member: any, index: number) => (
              <div key={index} className="bg-white rounded-xl p-6 space-y-3 hover:shadow-md transition group">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-primary-bark group-hover:text-primary-orange transition">
                    {member.name}
                  </h3>
                </div>
                {member.role && <p className="text-sm text-text-muted">Role: {member.role}</p>}
                {member.contact && <p className="text-sm text-text-muted">Contact: {member.contact}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resource Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-primary-bark">Fostering Guides</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* How Fostering Works */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-primary-orange/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-orange" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-bark mb-2">How Fostering Works</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Learn the basics of dog fostering, from getting matched with a pup to preparing for adoption day.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-start gap-2">
                <span className="text-primary-orange mt-0.5">•</span>
                <span>What to expect when fostering</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-orange mt-0.5">•</span>
                <span>Daily care routines and responsibilities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-orange mt-0.5">•</span>
                <span>Working with the rescue team</span>
              </li>
            </ul>
          </div>

          {/* Am I Ready? */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-primary-orange/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-orange" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-bark mb-2">Am I Ready to Foster?</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Assess your living situation, schedule, and resources to determine if fostering is right for you.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-start gap-2">
                <span className="text-primary-orange mt-0.5">•</span>
                <span>Time commitment and flexibility</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-orange mt-0.5">•</span>
                <span>Space and household requirements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-orange mt-0.5">•</span>
                <span>Costs and financial considerations</span>
              </li>
            </ul>
          </div>

          {/* Common Challenges */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-primary-orange/10 flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-primary-orange" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-bark mb-2">Common Challenges & Solutions</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Navigate common fostering challenges with tips from experienced foster families.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-start gap-2">
                <span className="text-primary-orange mt-0.5">•</span>
                <span>Managing separation anxiety</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-orange mt-0.5">•</span>
                <span>House training and behavior issues</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-orange mt-0.5">•</span>
                <span>Saying goodbye at adoption</span>
              </li>
            </ul>
          </div>

          {/* Foster Stories */}
          <Link
            href={`/org/${orgId}/foster/stories`}
            className="bg-gradient-to-br from-primary-orange/10 to-primary-orange/5 rounded-2xl shadow-sm p-6 space-y-4 hover:shadow-md transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center group-hover:scale-110 transition">
              <MessageCircle className="w-6 h-6 text-primary-orange" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-bark mb-2">Foster Stories</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Read heartwarming stories from foster families about their experiences saving dogs.
              </p>
            </div>
            <div className="text-sm font-medium text-primary-orange group-hover:underline">Read stories →</div>
          </Link>

          {/* Community Tips */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-primary-orange/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-orange" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-bark mb-2">Community Tips</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Practical advice and pro tips from the foster community to make your journey smoother.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-start gap-2">
                <span className="text-primary-orange mt-0.5">•</span>
                <span>Essential supplies checklist</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-orange mt-0.5">•</span>
                <span>Creating a safe space at home</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-orange mt-0.5">•</span>
                <span>Introducing foster dogs to pets</span>
              </li>
            </ul>
          </div>

          {/* Success & Impact */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-primary-orange/10 flex items-center justify-center">
              <Award className="w-6 h-6 text-primary-orange" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-bark mb-2">Your Impact</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Understand the life-saving impact of fostering and how you're making a difference.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-start gap-2">
                <span className="text-primary-orange mt-0.5">•</span>
                <span>How fostering saves lives</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-orange mt-0.5">•</span>
                <span>Success rates and outcomes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-orange mt-0.5">•</span>
                <span>Celebrating adoption milestones</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-primary-orange/10 to-primary-orange/5 rounded-3xl p-8 text-center space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold text-primary-bark">Need Help?</h2>
        <p className="text-base text-text-muted max-w-2xl mx-auto">
          If you have questions or need support, reach out to your rescue team directly through the Messages tab or
          contact emergency help.
        </p>
        <Link
          href={`/org/${orgId}/foster/emergency`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-orange px-8 py-4 text-base font-semibold text-white hover:bg-primary-orange/90 transition shadow-sm"
        >
          Get Emergency Help
        </Link>
      </div>
    </main>
  )
}
