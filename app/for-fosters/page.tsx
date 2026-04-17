import Link from "next/link"
import {
  Heart,
  MessageCircle,
  Calendar,
  FileText,
  Package,
  AlertCircle,
  ArrowRight,
  MapPin,
  Smartphone,
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

      {/* ─── HERO ─────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center space-y-4 sm:space-y-6">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: "#F7E2BD" }}
          >
            <Heart className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: "#D76B1A" }} />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight px-2">
            Open your home.<br className="hidden sm:block" /> Change a life.
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto px-2">
            Fostering saves animals' lives. Second Tail connects you with rescue organizations near you
            and handles all the coordination — so you can focus on the animal, not the admin.
          </p>
          <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link
              href="/sign-up/foster"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-4 text-white rounded-full font-semibold text-sm sm:text-base hover:opacity-90 transition-colors shadow-lg"
              style={{ backgroundColor: "#D76B1A" }}
            >
              Get Started — It&apos;s Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login/foster"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Already fostering? Log in
            </Link>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 pt-1">
            Free for fosters · No credit card required
          </p>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 mb-3 px-2">
            Start fostering in three steps
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto px-2">
            No experience required. Rescues are happy to guide first-timers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              n: "1",
              icon: Heart,
              title: "Create your free profile",
              body: "Tell rescues a bit about yourself — your home, your schedule, the kinds of animals you can take in.",
            },
            {
              n: "2",
              icon: MapPin,
              title: "Connect with a local rescue",
              body: "Browse rescue organizations in your area and express interest. They'll reach out to get you started.",
            },
            {
              n: "3",
              icon: Smartphone,
              title: "Get your foster & their care plan",
              body: "When you're matched, your rescue sends everything to your dashboard — care instructions, contacts, the works.",
            },
          ].map(({ n, icon: Icon, title, body }) => (
            <div key={n} className="flex flex-col items-center text-center gap-3 sm:gap-4">
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md flex-shrink-0"
                style={{ backgroundColor: "#D76B1A" }}
              >
                {n}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PHONE DEMO ───────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Everything in your pocket
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Your foster dashboard lives on your phone, so help is always one tap away.
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

      {/* ─── THE LITTLE THINGS ────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 mb-3 px-2">
            We handle the coordination.<br className="hidden sm:block" /> You handle the cuddles.
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto px-2">
            No more texts back and forth, lost instructions, or wondering who to call. It&apos;s all in the app.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[
            {
              icon: Package,
              title: "Request supplies in one tap",
              body: "Running low on food or poop bags? Send a supply request to your rescue directly from the app.",
            },
            {
              icon: FileText,
              title: "Care plan, always with you",
              body: "Medication schedules, feeding instructions, behavior notes — all organized in your dashboard.",
            },
            {
              icon: MessageCircle,
              title: "Message your rescue, not a group chat",
              body: "Have a question at 9pm? Send a direct message and get a real answer without the noise.",
            },
            {
              icon: Calendar,
              title: "Appointments, handled",
              body: "Request vet visits, schedule pickups, and track upcoming appointments in one calendar.",
            },
            {
              icon: FileText,
              title: "Log daily updates",
              body: "Jot down how your foster is doing. Your rescue stays informed without you having to call.",
            },
            {
              icon: AlertCircle,
              title: "Emergency help, 24/7",
              body: "Something feel off? One tap to emergency contacts and resources, any time of day.",
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
              <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── REASSURANCE BAND ─────────────────── */}
      <section className="bg-white py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 px-2">
            You don&apos;t have to figure it out alone.
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed px-2">
            Every rescue on Second Tail is there to support you — from your first placement to your
            hundredth. The app just makes staying connected easier.
          </p>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div
          className="relative rounded-3xl px-6 sm:px-12 py-12 sm:py-16 text-center overflow-hidden"
          style={{ backgroundColor: "#D76B1A" }}
        >
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Ready to open your home?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Create your free profile and start connecting with rescue organizations near you.
              A foster animal is waiting.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link
                href="/sign-up/foster"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-white rounded-full font-semibold text-sm sm:text-base hover:opacity-95 transition-opacity shadow-lg"
                style={{ color: "#D76B1A" }}
              >
                Get Started — It&apos;s Free
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
