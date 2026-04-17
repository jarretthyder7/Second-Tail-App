import { createClient } from "@/lib/supabase/server"
import { Metadata } from "next"
import Link from "next/link"
import { MapPin, Heart, Calendar, ArrowRight } from "lucide-react"
import { notFound } from "next/navigation"

interface Props {
  params: { userId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, city, state")
    .eq("id", params.userId)
    .maybeSingle()

  if (!profile) {
    return {
      title: "Foster Profile — Second Tail",
      description: "Connect with foster parents and rescue organizations on Second Tail.",
    }
  }

  const name = profile.name || "A foster parent"
  const location = profile.city && profile.state ? `${profile.city}, ${profile.state}` : null

  return {
    title: `${name} is fostering with Second Tail`,
    description: location
      ? `${name} fosters animals in ${location}. Connect with local rescues and foster parents on Second Tail.`
      : `${name} is a foster parent on Second Tail. Connect with local rescues and get involved in animal rescue.`,
    openGraph: {
      title: `${name} is fostering with Second Tail 🐾`,
      description: location
        ? `${name} fosters animals in ${location}. Join Second Tail to connect with local rescues.`
        : `${name} is a foster parent on Second Tail. Join to connect with local rescues.`,
      url: `https://getsecondtail.com/foster-profile/${params.userId}`,
      siteName: "Second Tail",
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${name} is fostering with Second Tail 🐾`,
      description: location
        ? `${name} fosters animals in ${location}. Join Second Tail to connect with local rescues.`
        : `${name} is a foster parent on Second Tail.`,
    },
  }
}

export default async function FosterProfilePage({ params }: Props) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, city, state, created_at, avatar_url")
    .eq("id", params.userId)
    .maybeSingle()

  if (!profile) {
    notFound()
  }

  const name = profile.name || "A foster parent"
  const location = profile.city && profile.state ? `${profile.city}, ${profile.state}` : null
  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null

  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FBF8F4" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold" style={{ color: "#D76B1A" }}>
            Second Tail
          </Link>
          <Link
            href="/sign-up/foster"
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
            style={{ backgroundColor: "#D76B1A" }}
          >
            Join Free
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-10">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mb-6">
          {/* Avatar */}
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={name}
              className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-white shadow"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow"
              style={{ backgroundColor: "#D76B1A" }}
            >
              {initials}
            </div>
          )}

          <h1 className="text-2xl font-bold text-gray-900 mb-1">{name}</h1>

          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-6">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {location}
              </span>
            )}
            {joinDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Fostering since {joinDate}
              </span>
            )}
          </div>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-2"
            style={{ backgroundColor: "#F7E2BD", color: "#D76B1A" }}
          >
            <Heart className="w-4 h-4 fill-current" />
            Foster Parent
          </div>
        </div>

        {/* CTA section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Want to foster too?</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-5">
            Second Tail connects foster parents with local rescue organizations — supply requests, vet appointments, and
            daily care updates, all in one place.
          </p>
          <Link
            href="/sign-up/foster"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-white text-sm transition hover:opacity-90"
            style={{ backgroundColor: "#D76B1A" }}
          >
            <Heart className="w-4 h-4" />
            Get started — it&apos;s free
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 mt-2 rounded-xl font-medium text-sm text-gray-500 hover:text-gray-800 transition"
          >
            Learn more about Second Tail
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
