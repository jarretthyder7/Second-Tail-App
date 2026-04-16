import Link from "next/link"
import { Heart, MessageCircle, Calendar, Shield, CheckCircle, FileText, Clock, Package, AlertCircle, Users } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function ForFostersPage() {
  return (
    <div className="min-h-screen bg-[#FBF8F4]">
      <SiteHeader />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center space-y-4 sm:space-y-6">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: "#F7E2BD" }}
          >
            <Heart className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: "#D76B1A" }} />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight px-2">
            Collaborate with your rescue organization
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto px-2">
            Sign up free, build your foster profile, and connect with rescue organizations in your area.
          </p>
          <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up/foster"
              className="inline-block w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-5 text-white rounded-full font-semibold text-sm sm:text-base hover:opacity-90 transition-colors shadow-lg"
              style={{ backgroundColor: "#D76B1A" }}
            >
              Sign Up to Foster
            </Link>
            <Link
              href="/login/foster"
              className="inline-block w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-5 border-2 rounded-full font-semibold text-sm sm:text-base transition-colors"
              style={{ borderColor: "#D76B1A", color: "#D76B1A" }}
            >
              Already a member? Log in
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-[#FDF6EC] rounded-2xl">
        <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 mb-8 sm:mb-12 text-center px-2">
          What you can do with Second Tail
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="rounded-2xl p-4 sm:p-6 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#D76B1A" }}>
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" style={{ color: "#D76B1A" }} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">View your assigned animal's profile and care plan</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              See details about the dog you're fostering, medical history, and specific care instructions.
            </p>
          </div>
          <div className="rounded-2xl p-4 sm:p-6 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#D76B1A" }}>
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" style={{ color: "#D76B1A" }} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Log daily updates and notes</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Track progress, note behaviors, and log any concerns. Your rescue team stays informed without having to ask.
            </p>
          </div>
          <div className="rounded-2xl p-4 sm:p-6 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#D76B1A" }}>
            <Package className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" style={{ color: "#D76B1A" }} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Request supplies from your rescue org</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Need food, toys, or medical supplies? Request them directly and track what's on the way.
            </p>
          </div>
          <div className="rounded-2xl p-4 sm:p-6 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#D76B1A" }}>
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" style={{ color: "#D76B1A" }} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Request and track appointments</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Schedule vet visits, check-ins, and pickup appointments. See everything on one calendar.
            </p>
          </div>
          <div className="rounded-2xl p-4 sm:p-6 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#D76B1A" }}>
            <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" style={{ color: "#D76B1A" }} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Message your rescue team directly</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Have a question at 9pm? Get answers fast without the group chat. Your rescue team is here to help.
            </p>
          </div>
          <div className="rounded-2xl p-4 sm:p-6 border" style={{ backgroundColor: "#F7E2BD", borderColor: "#D76B1A" }}>
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" style={{ color: "#D76B1A" }} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Access emergency contacts and resources 24/7</h3>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              Have a health or behavioral emergency? Get immediate access to emergency contacts and critical resources.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 px-2">You're not fostering alone</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed px-2">
            Second Tail helps you stay connected with your rescue organization, track care details, and get support when
            you need it—all in one simple dashboard.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8 px-2">
          Ready to get started?
        </h2>
        <p className="text-base sm:text-lg text-gray-600 mb-6 px-2">
          Create your foster profile today and start connecting with rescue organizations in your area.
        </p>
          <Link
            href="/sign-up/foster"
            className="inline-block w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-5 text-white rounded-full font-semibold text-sm sm:text-base hover:opacity-90 transition-colors shadow-lg"
            style={{ backgroundColor: "#D76B1A" }}
          >
            Sign Up to Foster
          </Link>
      </section>

      <SiteFooter />
    </div>
  )
}
