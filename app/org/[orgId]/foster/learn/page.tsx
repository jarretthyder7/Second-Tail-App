"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { BookOpen, Heart, Lightbulb, MessageCircle, Users, Award, ExternalLink } from "lucide-react"
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
