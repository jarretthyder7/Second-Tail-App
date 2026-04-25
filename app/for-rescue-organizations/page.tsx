import Link from "next/link"
import { Users, MessageCircle, DollarSign, Briefcase, Calendar, Package, AlertCircle, Check, ArrowRight, X } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function ForRescueOrganizationsPage() {
  return (
    <div className="min-h-screen bg-[#FBF8F4]">
      <SiteHeader />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center space-y-4 sm:space-y-6">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: "#F7E2BD" }}
          >
            <Users className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: "#50402B" }} />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight px-2">
            Built to support the people doing the hardest work.
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto px-2">
            Second Tail gives rescue organizations simple tools to manage fosters, track dog care, and keep everyone
            aligned—without spreadsheets and group texts.
          </p>
          <div className="pt-4 sm:pt-6">
            <Link
              href="/sign-up/rescue"
              className="inline-block w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-5 text-white rounded-full font-semibold text-sm sm:text-base hover:opacity-90 transition-colors shadow-lg"
              style={{ backgroundColor: "#50402B" }}
            >
              Join the waitlist
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Section - Rescue Desktop Onboarding */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            From setup to first foster, in minutes
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            A guided welcome flow gets your rescue up and running fast.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="relative w-full max-w-4xl aspect-[16/10] rounded-xl border-[8px] border-gray-900 bg-gray-900 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-5 bg-gray-800 flex items-center gap-1.5 px-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
            <img
              src="/demo/rescue-desktop.png"
              alt="Rescue admin onboarding flow on desktop"
              className="w-full h-full object-cover object-top pt-5"
            />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24" style={{ backgroundColor: "#FDF6EC" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-xl sm:text-2xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything you need to manage rescue operations
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for rescue organizations and foster parents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200 border-t-4" style={{ borderTopColor: "#D76B1A" }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}>
                <Briefcase className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#D76B1A" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Foster Management</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Invite fosters by email. Assign them animals. Track who&apos;s caring for what dog.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200 border-t-4" style={{ borderTopColor: "#50402B" }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(80, 64, 43, 0.12)" }}>
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#50402B" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Appointment Scheduling</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Vet visits, check-ins, drop-offs. One calendar, no more group texts.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200 border-t-4" style={{ borderTopColor: "#D76B1A" }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}>
                <Package className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#D76B1A" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Supply Requests</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Fosters request supplies. You approve. Done.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200 border-t-4" style={{ borderTopColor: "#50402B" }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(80, 64, 43, 0.12)" }}>
                <DollarSign className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#50402B" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Reimbursements</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Foster paid out of pocket? Handle it without the paperwork.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200 border-t-4" style={{ borderTopColor: "#D76B1A" }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}>
                <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#D76B1A" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Team Messaging</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Message individual fosters or your whole team. No more group chat chaos.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200 border-t-4" style={{ borderTopColor: "#50402B" }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" style={{ backgroundColor: "rgba(80, 64, 43, 0.12)" }}>
                <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#50402B" }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Emergency Support</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Fosters get emergency contacts and resources 24/7 when they need help fast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INCLUDED CHECKLIST ───────────────── */}
      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#FDF6EC] rounded-3xl p-8 sm:p-12 lg:p-16 border border-[#50402B]/10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#D76B1A" }}>
                  Included in every plan
                </p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight tracking-tight">
                  Every tool your rescue needs.
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#D76B1A]/30 self-start sm:self-end">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-sm font-semibold text-gray-900">Free during beta</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {[
                "Foster invitations by email",
                "Animal profiles with full history",
                "Shared appointment calendar",
                "Supply request management",
                "Reimbursement tracking",
                "Direct team & foster messaging",
                "Spreadsheet import for existing data",
                "Mobile-friendly foster dashboard",
                "Emergency contacts & resources",
                "Daily care updates from fosters",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 py-1">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(215, 107, 26, 0.15)" }}
                  >
                    <Check className="w-3.5 h-3.5" style={{ color: "#D76B1A" }} strokeWidth={3} />
                  </div>
                  <span className="text-sm sm:text-base text-gray-900">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── BEFORE / AFTER ───────────────────── */}
      <section className="bg-[#FBF8F4] py-16 sm:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-4">
              Less chaos. More fosters fostered.
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Second Tail doesn't add to your plate — it clears it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Before */}
            <div className="rounded-3xl p-8 sm:p-10 bg-gray-100 border border-gray-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Before Second Tail</p>
              <ul className="space-y-3">
                {[
                  "Spreadsheets, group texts, sticky notes",
                  "Volunteers chasing each other for updates",
                  "Supplies and reimbursements tracked in DMs",
                  "Onboarding a new foster takes a phone call",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-600">
                    <X className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div
              className="rounded-3xl p-8 sm:p-10 text-white shadow-lg"
              style={{ backgroundColor: "#50402B" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#F7E2BD" }}>
                With Second Tail
              </p>
              <ul className="space-y-3">
                {[
                  "One dashboard the whole team can see",
                  "Updates flow in from fosters automatically",
                  "Supplies and reimbursements tracked in one tap",
                  "New fosters self-onboard in minutes",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#F7E2BD" }} strokeWidth={3} />
                    <span className="text-sm sm:text-base leading-relaxed text-white/95">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────── */}
      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-3xl p-8 sm:p-12 lg:p-16 text-center text-white relative overflow-hidden"
            style={{ backgroundColor: "#D76B1A" }}
          >
            {/* Soft decorative blobs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4 max-w-2xl mx-auto">
                Ready to streamline your rescue?
              </h2>
              <p className="text-base sm:text-lg text-white/90 max-w-xl mx-auto mb-8 sm:mb-10">
                Set up your organization in minutes. Invite your first fosters today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
                <Link
                  href="/sign-up/rescue"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white text-[#D76B1A] rounded-full font-semibold text-base sm:text-lg hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Join the waitlist
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login/rescue"
                  className="text-sm sm:text-base font-semibold text-white/90 hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  Already invited? Log in →
                </Link>
              </div>
              <p className="text-xs sm:text-sm text-white/70 pt-6">
                Free during beta · No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
