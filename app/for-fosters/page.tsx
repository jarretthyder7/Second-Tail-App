import Link from "next/link"
import {
  Heart,
  MessageCircle,
  Calendar,
  FileText,
  Package,
  AlertCircle,
  Check,
  X,
  ArrowRight,
} from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function ForFostersPage() {
  return (
    <div className="min-h-screen bg-[#FBF8F4]">
      <style>{`
        @keyframes float-soft {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .float-soft { animation: float-soft 5s ease-in-out infinite; }
      `}</style>

      <SiteHeader />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center space-y-4 sm:space-y-6">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: "#F7E2BD" }}
          >
            <Heart className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: "#D76B1A" }} />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight px-2">
            Fostering, finally organized.
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto px-2">
            Care plans, supply requests, vet appointments, and direct messaging with your rescue — all in one
            place, right from your phone.
          </p>
          <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link
              href="/sign-up/foster"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-4 text-white rounded-full font-semibold text-sm sm:text-base hover:opacity-90 transition-colors shadow-lg"
              style={{ backgroundColor: "#D76B1A" }}
            >
              Sign Up to Foster
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login/foster"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Already a member? Log in
            </Link>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 pt-2">
            Free for fosters · Works with any rescue using Second Tail
          </p>
        </div>
      </section>

      {/* Phone demo */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Designed for fostering on the go
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Your full foster dashboard, right from your phone.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[9/19] rounded-[2.5rem] border-[10px] border-gray-900 bg-gray-900 shadow-2xl overflow-hidden float-soft">
            <img
              src="/demo/foster-mobile.png"
              alt="Foster dashboard on mobile"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </section>

      {/* What you can do */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Everything you need in one app
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Stop juggling group chats, sticky notes, and lost paperwork.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: Heart,
              title: "Care plans at your fingertips",
              body: "See your animal's profile, medical history, and feeding or behavior instructions any time.",
            },
            {
              icon: FileText,
              title: "Daily updates in seconds",
              body: "Log progress notes and concerns. Your rescue stays in the loop without having to ask.",
            },
            {
              icon: Package,
              title: "Request supplies",
              body: "Need food, meds, or toys? Submit a request and track what's on the way.",
            },
            {
              icon: Calendar,
              title: "Appointments, sorted",
              body: "Book vet visits, check-ins, and pickups. Everything lives on one shared calendar.",
            },
            {
              icon: MessageCircle,
              title: "Message your rescue directly",
              body: "Have a question at 9pm? Skip the group chat and get a fast, focused answer.",
            },
            {
              icon: AlertCircle,
              title: "Emergency help, 24/7",
              body: "One tap to emergency contacts and critical resources when something feels off.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl p-5 sm:p-6 bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}
              >
                <Icon className="w-5 h-5" style={{ color: "#D76B1A" }} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Before / After */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Less stress. More time with your foster.
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Here's what changes the day you start using Second Tail.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Before */}
          <div className="rounded-2xl p-5 sm:p-7 bg-gray-50 border border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Without Second Tail</div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">The usual fostering chaos</h3>
            <ul className="space-y-3">
              {[
                "Endless group chats and missed messages",
                "Lost medication dosages and care notes",
                "Scrambling to remember vet appointment times",
                "Texting the rescue for every small question",
                "Paper forms and sticky-note reminders",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div
            className="rounded-2xl p-5 sm:p-7 border"
            style={{ backgroundColor: "#50402B", borderColor: "#50402B" }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#F7E2BD" }}>
              With Second Tail
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-5">One calm dashboard</h3>
            <ul className="space-y-3">
              {[
                "Direct messaging — no more group chat noise",
                "Care plans and meds always one tap away",
                "Appointments on a shared calendar",
                "Supply requests submitted in seconds",
                "Emergency contacts ready when you need them",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#F7E2BD" }} />
                  <span className="text-sm text-white/90">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div
          className="relative rounded-3xl px-6 sm:px-12 py-12 sm:py-16 text-center overflow-hidden"
          style={{ backgroundColor: "#D76B1A" }}
        >
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              You're not fostering alone.
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Create your foster profile and connect with rescue organizations near you in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link
                href="/sign-up/foster"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-white rounded-full font-semibold text-sm sm:text-base hover:opacity-95 transition-opacity shadow-lg"
                style={{ color: "#D76B1A" }}
              >
                Sign Up to Foster
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login/foster"
                className="text-sm font-medium text-white/90 hover:text-white transition-colors"
              >
                Already a member? Log in
              </Link>
            </div>
            <p className="text-xs sm:text-sm text-white/80 pt-6">
              Free for fosters · No credit card required
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
