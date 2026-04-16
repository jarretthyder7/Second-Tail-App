import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata = {
  title: "Terms of Service — Second Tail",
  description: "Terms of Service for Second Tail, the foster coordination platform for animal rescue organizations.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SiteHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Last updated: April 2026</p>
            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Please read these terms before using Second Tail. By creating an account, you agree to them.
            </p>
          </div>

          <hr className="border-gray-200" />

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">What is Second Tail?</h2>
            <p className="text-gray-700 leading-relaxed">
              Second Tail is a foster coordination platform built for animal rescue organizations and their foster
              parents. It gives rescue organizations tools to manage their foster networks — inviting fosters,
              tracking animal care, and communicating with their team — and gives foster parents a simple dashboard
              to stay connected with their rescue.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Second Tail is currently in beta. That means the platform is actively being developed and improved.
              Some features may change, and you may occasionally encounter bugs. We appreciate your patience.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Who can use Second Tail?</h2>
            <p className="text-gray-700 leading-relaxed">
              Second Tail is intended for two types of users:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 pl-2">
              <li>
                <strong>Rescue organizations</strong> — registered nonprofits or animal rescue groups that manage
                foster programs.
              </li>
              <li>
                <strong>Foster parents</strong> — individuals approved by a rescue organization to foster animals
                through the platform.
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You must be at least 18 years old to create an account. By signing up, you confirm that you meet
              this requirement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Your responsibilities</h2>
            <p className="text-gray-700 leading-relaxed">When using Second Tail, you agree to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 pl-2">
              <li>Provide accurate information when creating your account and using the platform.</li>
              <li>Keep your login credentials secure and not share them with others.</li>
              <li>Use the platform only for its intended purpose — coordinating animal foster care.</li>
              <li>Treat other users with respect in all communications within the platform.</li>
              <li>Not misuse, reverse-engineer, or attempt to disrupt the platform or its services.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Beta service — provided as-is</h2>
            <p className="text-gray-700 leading-relaxed">
              Second Tail is provided as-is during its beta period. While we work hard to keep things running
              smoothly, we cannot guarantee uninterrupted access or that the platform will be error-free at all
              times. We are not liable for any losses or disruptions caused by downtime or bugs during this phase.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to update, change, or discontinue any part of the platform at any time, and
              will do our best to communicate significant changes in advance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Account termination</h2>
            <p className="text-gray-700 leading-relaxed">
              Second Tail may suspend or terminate accounts that violate these terms, misuse the platform, or
              engage in harmful or abusive behavior. If your account is terminated, you will be notified where
              possible.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You can also delete your account at any time by contacting us at{" "}
              <a href="mailto:support@secondtail.com" className="text-gray-900 font-medium underline hover:no-underline">
                support@secondtail.com
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Questions?</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these terms, reach out to us at{" "}
              <a href="mailto:support@secondtail.com" className="text-gray-900 font-medium underline hover:no-underline">
                support@secondtail.com
              </a>
              .
            </p>
          </section>

          <hr className="border-gray-200" />

          <Link href="/" className="inline-block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            ← Back to home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
