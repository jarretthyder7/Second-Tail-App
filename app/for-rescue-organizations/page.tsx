import Link from "next/link"
import { Users, MessageCircle, Mail, Plus, Clock, DollarSign, Users2, FileUp, Briefcase, Calendar, Package, AlertCircle, Heart } from "lucide-react"
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
              Create Your Account
            </Link>
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

      {/* Features Grid Section */}
      <section className="bg-[#FDF6EC] py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 lg:mb-12 text-center px-2">
            What&apos;s included
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex items-start gap-2 p-3 sm:p-4">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" style={{ color: "#50402B" }} />
              <span className="text-xs sm:text-sm text-gray-900 font-semibold">Foster invitations</span>
            </div>
            <div className="flex items-start gap-2 p-3 sm:p-4">
              <FileUp className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" style={{ color: "#50402B" }} />
              <span className="text-xs sm:text-sm text-gray-900 font-semibold">Animal profiles</span>
            </div>
            <div className="flex items-start gap-2 p-3 sm:p-4">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" style={{ color: "#50402B" }} />
              <span className="text-xs sm:text-sm text-gray-900 font-semibold">Appointment calendar</span>
            </div>
            <div className="flex items-start gap-2 p-3 sm:p-4">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" style={{ color: "#50402B" }} />
              <span className="text-xs sm:text-sm text-gray-900 font-semibold">Supply request management</span>
            </div>
            <div className="flex items-start gap-2 p-3 sm:p-4">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" style={{ color: "#50402B" }} />
              <span className="text-xs sm:text-sm text-gray-900 font-semibold">Reimbursement tracking</span>
            </div>
            <div className="flex items-start gap-2 p-3 sm:p-4">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" style={{ color: "#50402B" }} />
              <span className="text-xs sm:text-sm text-gray-900 font-semibold">Team chat</span>
            </div>
            <div className="flex items-start gap-2 p-3 sm:p-4">
              <FileUp className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5" style={{ color: "#50402B" }} />
              <span className="text-xs sm:text-sm text-gray-900 font-semibold">Data import from spreadsheets</span>
            </div>
            <div className="flex items-start gap-3 p-4">
              <Users2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: "#50402B" }} />
              <span className="text-gray-900 font-semibold">Mobile-friendly foster dashboard</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 px-2">
            This saves you time. This reduces chaos.
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed px-2">
            Your team is stretched thin. Second Tail doesn't add more to your plate—it clears it. Simple tools that help
            you scale without burnout.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center space-y-6 sm:space-y-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 px-2">
          Ready to streamline your rescue operations?
        </h2>
        <Link
          href="/sign-up/rescue"
            className="inline-block w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-white rounded-full font-semibold text-base sm:text-lg hover:opacity-90 transition-colors shadow-lg"
          style={{ backgroundColor: "#50402B" }}
        >
          Request Early Access
        </Link>
      </section>

      <SiteFooter />
    </div>
  )
}
