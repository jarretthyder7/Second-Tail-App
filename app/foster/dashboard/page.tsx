import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LogOut, Heart, MapPin, Copy, Users } from "lucide-react"

export default async function FosterDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login/foster")
  }

  // Read from profiles table (not users)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login/foster")
  }

  // If already connected to an org, redirect to org foster dashboard
  if (profile.organization_id) {
    redirect(`/org/${profile.organization_id}/foster/dashboard`)
  }

  const { data: fosterProfile } = await supabase
    .from("foster_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  // Fetch rescue organizations in the same state
  const { data: nearbyRescues } = await supabase
    .from("organizations")
    .select("id, name, city, state")
    .eq("state", fosterProfile?.state ?? "")
    .eq("verified", true)
    .limit(10)

  // Fetch animals available for fostering in the same state
  const { data: availableAnimals } = await supabase
    .from("animals")
    .select("id, name, breed, size, organization_id")
    .eq("status", "available")
    .eq("public_listing", true)
    .limit(12)

  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/foster/profile/${user.id}`

  return (
    <div className="min-h-screen bg-[#FDF6EC]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Second Tail
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {profile.name ?? user.email}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        {/* Welcome Banner */}
        <section className="bg-[#D76B1A] rounded-2xl p-6 sm:p-8 text-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Welcome{profile.name ? `, ${profile.name.split(" ")[0]}` : ""}!
              </h1>
              <p className="text-white/90 text-sm sm:text-base max-w-xl">
                You&apos;re registered as a foster. Connect with a rescue organization near you to start fostering animals.
              </p>
            </div>
            <Heart className="w-10 h-10 text-white/30 flex-shrink-0" />
          </div>
        </section>

        {/* Connect with a Rescue */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Get connected</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <Users className="w-8 h-8 mb-4" style={{ color: "#D76B1A" }} />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Share your profile</h3>
              <p className="text-sm text-gray-600 mb-4">
                Send this link to a rescue organization so they can invite you to their network.
              </p>
              <CopyProfileLink url={profileUrl} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <MapPin className="w-8 h-8 mb-4" style={{ color: "#D76B1A" }} />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Rescues near you</h3>
              <p className="text-sm text-gray-600 mb-4">
                Browse verified rescue organizations in your area and reach out directly.
              </p>
              <a
                href="#rescues"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-colors"
                style={{ backgroundColor: "#D76B1A" }}
              >
                View rescues
              </a>
            </div>
          </div>
        </section>

        {/* Rescues Near You */}
        <section id="rescues">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Rescues near you
          </h2>
          {nearbyRescues && nearbyRescues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyRescues.map((rescue) => (
                <div
                  key={rescue.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3"
                >
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{rescue.name}</h3>
                    <p className="text-sm text-gray-500">
                      {rescue.city}, {rescue.state}
                    </p>
                  </div>
                  <a
                    href={`/rescue/${rescue.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold border-2 transition-colors"
                    style={{ borderColor: "#D76B1A", color: "#D76B1A" }}
                  >
                    View organization
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                No verified rescues found in your area yet. Check back soon or share your profile link directly.
              </p>
            </div>
          )}
        </section>

        {/* Animals Available for Fostering */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Animals looking for fosters
          </h2>
          {availableAnimals && availableAnimals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableAnimals.map((animal) => (
                <div
                  key={animal.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3"
                >
                  <div className="w-full h-32 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Heart className="w-8 h-8 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{animal.name}</h3>
                    <p className="text-sm text-gray-500">
                      {[animal.breed, animal.size].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <InterestedButton animalName={animal.name} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                No animals are listed for fostering in your area right now. Check back soon.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#D76B1A] mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-white/80">
          © 2026 Second Tail. Made with care for rescues and fosters.
        </div>
      </footer>
    </div>
  )
}

// Client component for copy-to-clipboard
function CopyProfileLink({ url }: { url: string }) {
  "use client"
  return (
    <button
      onClick={() => navigator.clipboard.writeText(url)}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-colors"
      style={{ backgroundColor: "#D76B1A" }}
    >
      <Copy className="w-4 h-4" />
      Copy profile link
    </button>
  )
}

// Client component for interested button
function InterestedButton({ animalName }: { animalName: string }) {
  "use client"
  return (
    <button
      onClick={() => alert(`We'll let the rescue know you're interested in fostering ${animalName}!`)}
      className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold text-white hover:opacity-90 transition-colors w-full"
      style={{ backgroundColor: "#D76B1A" }}
    >
      {"I'm interested"}
    </button>
  )
}
