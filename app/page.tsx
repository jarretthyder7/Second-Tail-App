"use client"

import { useState } from "react"
import Link from "next/link"
import {
  MessageCircle, Truck, HeartHandshake, Stethoscope,
  ChevronDown, Quote,
} from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function Home() {
  const [activeView, setActiveView] = useState<"foster" | "rescue">("rescue")

  return (
    <div className="min-h-screen bg-white">
      {/* Subtle keyframes for the device frames */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .float-slow { animation: float-slow 5s ease-in-out infinite; }
        .float-slower { animation: float-slower 6s ease-in-out infinite; animation-delay: 1s; }
      `}</style>

      <SiteHeader />

      {/* ─── HERO ─────────────────────────────── */}
      <section className="pt-10 sm:pt-12 lg:pt-16 pb-8 sm:pb-12 lg:pb-16" style={{ backgroundColor: "#FDF6EC" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 text-center">
            <div className="flex justify-center mb-2 sm:mb-3">
              <img
                src="/logo-dog.png"
                alt="Second Tail"
                className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
              Fostering and rescue, made easier for everyone involved.
            </h1>

            <p className="text-base sm:text-xl lg:text-2xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
              Rescue coordination without the chaos. Invite fosters, assign animals, track appointments, handle supply requests — everything from one dashboard.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5 justify-center pt-4 sm:pt-6">
              <Link
                href="/sign-up/rescue"
                className="inline-flex items-center justify-center w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-white rounded-full font-semibold text-base sm:text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                style={{ backgroundColor: "#D76B1A" }}
              >
                Register Your Rescue
              </Link>
              <Link
                href="/sign-up/foster"
                className="inline-flex items-center justify-center text-sm sm:text-base font-semibold transition-colors hover:underline underline-offset-4"
                style={{ color: "#D76B1A" }}
              >
                Or sign up as a foster →
              </Link>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 pt-2">
              Free for foster parents · No credit card required · Built by a foster
            </p>
          </div>
        </div>
      </section>

      {/* curved divider */}
      <div className="relative h-16 sm:h-24" style={{ backgroundColor: "#FDF6EC" }}>
        <svg className="absolute bottom-0 w-full h-16 sm:h-24" viewBox="0 0 1440 96" fill="none" preserveAspectRatio="none">
          <path d="M0 96L1440 96L1440 0C1440 0 1080 96 720 96C360 96 0 0 0 0L0 96Z" fill="white" />
        </svg>
      </div>

      {/* ─── 4 PILLARS ────────────────────────── */}
      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-4">
              One platform. Built for rescues — and the fosters they rely on.
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Four ways Second Tail powers your rescue and supports your foster network.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: MessageCircle,
                title: "Coordinate",
                tagline: "Keep your team and fosters in sync",
                items: ["One inbox per animal", "Direct messaging across your network", "No more scattered group chats"],
              },
              {
                icon: Stethoscope,
                title: "Care",
                tagline: "Every animal's history in one place",
                items: ["Medical records & vaccine history", "Medication schedules & dosages", "Behavior notes that follow each dog"],
              },
              {
                icon: Truck,
                title: "Logistics",
                tagline: "Run the day-to-day without the texts",
                items: ["Vet appointments on a shared calendar", "Supply requests and approvals", "Pickups, drop-offs, and reimbursements"],
              },
              {
                icon: HeartHandshake,
                title: "Support",
                tagline: "Back up your fosters, 24/7",
                items: ["Emergency contacts & resources", "Quick-answer help when it matters", "Daily updates and milestones"],
              },
            ].map((cat) => (
              <div
                key={cat.title}
                className="rounded-2xl p-6 bg-[#FBF8F4] border border-[#5a4a42]/10 hover:border-[#D76B1A]/40 hover:-translate-y-0.5 transition-all"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "rgba(215, 107, 26, 0.12)" }}
                >
                  <cat.icon className="w-5 h-5" style={{ color: "#D76B1A" }} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{cat.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{cat.tagline}</p>
                <ul className="space-y-2">
                  {cat.items.map((item) => (
                    <li key={item} className="text-sm text-gray-700 leading-relaxed flex items-start gap-2">
                      <span className="text-[#D76B1A] mt-1 flex-shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 sm:mt-16 max-w-2xl mx-auto">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              Everything your rescue runs on, finally in one place.
            </p>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS + DEMO (combined) ───── */}
      <section className="w-full py-16 sm:py-20 lg:py-24 bg-[#FBF8F4]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 text-center mb-6 sm:mb-8 px-2 tracking-tight">
            How Second Tail works
          </h2>
          <p className="text-base sm:text-lg text-gray-600 text-center max-w-2xl mx-auto mb-10 sm:mb-12 px-2">
            A powerful desktop dashboard for rescue teams and a mobile-first experience for fosters on the go.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 px-4">
            <button
              onClick={() => setActiveView("rescue")}
              className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-3 rounded-full font-semibold transition-all text-base ${
                activeView === "rescue" ? "text-white shadow-lg" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              style={activeView === "rescue" ? { backgroundColor: "#5a4a42" } : {}}
            >
              For Rescue Organizations
            </button>
            <button
              onClick={() => setActiveView("foster")}
              className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-3 rounded-full font-semibold transition-all text-base ${
                activeView === "foster" ? "text-white shadow-lg" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              style={activeView === "foster" ? { backgroundColor: "#D76B1A" } : {}}
            >
              For Foster Parents
            </button>
          </div>

          {activeView === "rescue" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Steps */}
              <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
                {[
                  { n: 1, t: "Create your org and invite your team", d: "Register your rescue, add team members, and set up your organization." },
                  { n: 2, t: "Add your animals and invite fosters by email", d: "Onboard your rescue animals and send invitations to foster parents." },
                  { n: 3, t: "Manage everything from one dashboard", d: "Track placements, coordinate appointments, and answer requests in one place." },
                ].map((s) => (
                  <div key={s.n} className="flex gap-4 sm:gap-5">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full text-white flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0 shadow-md"
                      style={{ backgroundColor: "#5a4a42" }}
                    >
                      {s.n}
                    </div>
                    <div className="pt-1 sm:pt-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5">{s.t}</h3>
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 sm:pt-4 pl-0 sm:pl-[68px]">
                  <Link
                    href="/sign-up/rescue"
                    className="inline-block px-8 py-3.5 rounded-full font-semibold text-base hover:opacity-90 transition-all text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    style={{ backgroundColor: "#5a4a42" }}
                  >
                    Register Your Rescue
                  </Link>
                </div>
              </div>

              {/* Desktop frame */}
              <div className="flex justify-center order-1 lg:order-2">
                <div className="float-slower relative w-full max-w-xl aspect-[16/10] rounded-lg border-[6px] border-gray-900 bg-gray-900 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gray-800 flex items-center gap-1 px-2 z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  </div>
                  <img
                    src="/demo/rescue-desktop.png"
                    alt="Rescue admin dashboard on desktop"
                    className="w-full h-full object-cover object-top pt-4"
                    onError={(e) => { e.currentTarget.src = "/placeholder.svg" }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Steps */}
              <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
                {[
                  { n: 1, t: "Sign up and get started", d: "Create your foster account directly. No invite required—join and connect with rescues." },
                  { n: 2, t: "Connect with rescues and receive placements", d: "Browse rescues, express interest, and receive animals to foster." },
                  { n: 3, t: "Track care, share updates, request supplies", d: "Manage everything in one place and communicate seamlessly with your rescue partner." },
                ].map((s) => (
                  <div key={s.n} className="flex gap-4 sm:gap-5">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full text-white flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0 shadow-md"
                      style={{ backgroundColor: "#D76B1A" }}
                    >
                      {s.n}
                    </div>
                    <div className="pt-1 sm:pt-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5">{s.t}</h3>
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 sm:pt-4 pl-0 sm:pl-[68px]">
                  <Link
                    href="/sign-up/foster"
                    className="inline-block px-8 py-3.5 rounded-full font-semibold text-base hover:opacity-90 transition-all text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    style={{ backgroundColor: "#D76B1A" }}
                  >
                    Sign Up to Foster
                  </Link>
                </div>
              </div>

              {/* Phone frame */}
              <div className="flex justify-center order-1 lg:order-2">
                <div className="float-slow relative w-full max-w-[240px] sm:max-w-[260px] aspect-[9/19] rounded-[2rem] border-[8px] border-gray-900 bg-gray-900 shadow-2xl overflow-hidden">
                  <img
                    src="/demo/foster-mobile.png"
                    alt="Foster dashboard on mobile"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => { e.currentTarget.src = "/placeholder.svg" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── FOUNDER ──────────────────────────── */}
      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#FDF6EC] rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden">
            <Quote className="absolute top-6 right-6 w-16 h-16 sm:w-20 sm:h-20 text-[#D76B1A]/15" />
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start sm:items-center relative">
              {/* Avatar with photo + gradient fallback */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#D76B1A]/40 to-[#5a4a42]/40 flex items-center justify-center flex-shrink-0 border-4 border-white shadow-md overflow-hidden">
                <img
                  src="/founder.jpg"
                  alt="Founder of Second Tail"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none" }}
                />
              </div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "#D76B1A" }}>
                  From the founder
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900 leading-relaxed mb-4">
                  "I built this because I was juggling three group chats, a Google Sheet, and a stack of vet receipts — for one foster dog."
                </p>
                <p className="text-sm sm:text-base text-gray-600">
                  — Jarrett, founder &amp; active foster parent
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────── */}
      <section className="bg-[#FBF8F4] py-16 sm:py-20 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
              Common questions
            </h2>
            <p className="text-base sm:text-lg text-gray-600">Real answers to what rescues ask first.</p>
          </div>
          <div className="space-y-3">
            {[
              {
                q: "Is it really free?",
                a: "Yes — Second Tail is free for foster parents, always. Rescue organizations get a free tier to manage their first foster network, with paid plans coming for larger orgs.",
              },
              {
                q: "How is this different from Petstablished or Shelterluv?",
                a: "Those tools focus on shelter management and adoptions. Second Tail is built for the day-to-day of fostering — communication, supplies, appointments, and care logging — the work that happens in between intake and adoption.",
              },
              {
                q: "Where does my data live?",
                a: "Securely on Supabase, hosted in the US. Your foster network's data is yours — we don't sell it, share it, or train models on it.",
              },
              {
                q: "Can my whole volunteer team use it?",
                a: "Yes. Invite as many team members and fosters as you need. Everyone sees what they're meant to see, no more, no less.",
              },
              {
                q: "What if I only have a few fosters right now?",
                a: "Perfect. Second Tail works whether you have 2 fosters or 200. Start small and grow into it.",
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group bg-white rounded-2xl border border-[#5a4a42]/10 overflow-hidden hover:border-[#D76B1A]/30 transition-colors"
              >
                <summary className="flex items-center justify-between cursor-pointer p-5 sm:p-6 list-none">
                  <span className="font-semibold text-gray-900 text-base sm:text-lg pr-4">{item.q}</span>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm sm:text-base text-gray-600 leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL TWO-COLUMN CTA ─────────────── */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Rescue card */}
            <div
              className="rounded-3xl p-8 sm:p-10 lg:p-12 text-white flex flex-col"
              style={{ backgroundColor: "#D76B1A" }}
            >
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 leading-tight">
                For rescue organizations
              </h3>
              <p className="text-base sm:text-lg text-white/90 mb-8 flex-1">
                Manage your foster network without the chaos.
              </p>
              <Link
                href="/sign-up/rescue"
                className="inline-flex items-center justify-center w-full sm:w-fit bg-white text-[#D76B1A] rounded-full font-semibold text-base px-8 py-4 hover:bg-gray-50 transition-colors"
              >
                Register Your Rescue →
              </Link>
            </div>

            {/* Foster card */}
            <div
              className="rounded-3xl p-8 sm:p-10 lg:p-12 flex flex-col border-2"
              style={{ backgroundColor: "#FDF6EC", borderColor: "#D76B1A" }}
            >
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 leading-tight text-gray-900">
                For foster parents
              </h3>
              <p className="text-base sm:text-lg text-gray-700 mb-8 flex-1">
                Sign up free and connect with rescues in your area.
              </p>
              <Link
                href="/sign-up/foster"
                className="inline-flex items-center justify-center w-full sm:w-fit text-white rounded-full font-semibold text-base px-8 py-4 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#D76B1A" }}
              >
                Sign Up to Foster →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
