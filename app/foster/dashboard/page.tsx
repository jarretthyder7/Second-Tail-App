'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Copy, Check, LogOut, MapPin, Heart, PawPrint, Users, Mail,
  Sparkles, ArrowRight, Home, ShoppingBag, Clock, MessageCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { InviteRescueModal } from '@/app/components/foster/invite-rescue-modal'

interface FosterProfile {
  id: string
  user_id: string
  city: string
  state: string
  created_at: string
}

interface Rescue {
  id: string
  name: string
  city: string
  state: string
}

interface Dog {
  id: string
  name: string
  breed: string
  size: string
  organization_id: string
}

export default function FosterDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [fosterProfile, setFosterProfile] = useState<FosterProfile | null>(null)
  const [rescues, setRescues] = useState<Rescue[]>([])
  const [dogs, setDogs] = useState<Dog[]>([])
  const [apiAnimals, setApiAnimals] = useState<any[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [selectedAnimal, setSelectedAnimal] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showInviteRescueModal, setShowInviteRescueModal] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          router.push('/login/foster')
          return
        }
        setUser(currentUser)

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (profileError) throw profileError
        setProfile(profileData)

        // If already connected to an org, redirect to the connected dashboard
        if (profileData?.organization_id) {
          router.push(`/org/${profileData.organization_id}/foster/dashboard`)
          return
        }

        const { data: fosterData, error: fosterError } = await supabase
          .from('foster_profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .single()

        if (fosterError && fosterError.code !== 'PGRST116') throw fosterError
        if (fosterData) {
          setFosterProfile(fosterData)

          const { data: rescueData, error: rescueError } = await supabase
            .from('organizations')
            .select('id, name, city, state')
            .eq('state', fosterData.state)
            .eq('verified', true)

          if (rescueError) throw rescueError
          setRescues(rescueData || [])

          const { data: dogsData, error: dogsError } = await supabase
            .from('dogs')
            .select('id, name, breed, size, organization_id')
            .eq('public_listing', true)
            .in('organization_id', rescueData?.map(r => r.id) || [])

          if (dogsError) throw dogsError
          setDogs(dogsData || [])

          // Fetch real adoptable animals from RescueGroups for this state
          if (fosterData.state) {
            fetch(`/api/rescue-animals?state=${encodeURIComponent(fosterData.state)}&limit=12`)
              .then((r) => r.json())
              .then((j) => {
                if (j?.ok && Array.isArray(j.animals)) setApiAnimals(j.animals)
              })
              .catch(() => {})
              .finally(() => setApiLoading(false))
          } else {
            setApiLoading(false)
          }
        } else {
          setApiLoading(false)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading foster dashboard:', error)
        toast.error('Failed to load dashboard')
        setLoading(false)
      }
    }

    loadData()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleCopyInviteLink = () => {
    // Use the current origin so the link works whether the foster opened the
    // app via www.getsecondtail.com or getsecondtail.com (bare domain).
    const link = `${window.location.origin}/sign-up/foster`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Invite link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const scrollToAnimals = () => {
    document.getElementById('animals-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Support both new (name) and old (full_name) columns
  const displayName: string = profile?.name || profile?.full_name || ''
  const firstName = displayName.split(' ')[0] || 'there'
  const stateLabel = fosterProfile?.state || 'your area'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF6EC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D76B1A] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF6EC]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Second Tail
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#D76B1A] to-[#B85A14] text-white shadow-sm">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" aria-hidden />
          <div className="absolute -left-16 -bottom-16 w-72 h-72 rounded-full bg-white/5 blur-3xl" aria-hidden />
          <div className="relative z-10 p-6 sm:p-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs sm:text-sm font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              You're one step away
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
              Welcome{firstName !== 'there' ? `, ${firstName}` : ''}!
            </h1>
            <p className="text-white/95 text-base sm:text-lg leading-relaxed max-w-2xl">
              You're part of the Second Tail foster network. Connect with a rescue in {stateLabel} and your first foster could be on their way home soon.
            </p>
            {rescues.length > 0 && (
              <button
                onClick={() => document.getElementById('rescues-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-white text-[#D76B1A] rounded-full font-semibold hover:bg-white/95 transition-colors"
              >
                See rescues near you
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Your Journey */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your foster journey</h2>
            <p className="text-sm text-gray-600 mt-1">Here's what's ahead</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <JourneyStep number="1" title="Connect" desc="Link up with a rescue" active />
            <JourneyStep number="2" title="Get matched" desc="Meet a dog who needs you" />
            <JourneyStep number="3" title="Welcome home" desc="Open your doors" />
            <JourneyStep number="4" title="Change a life" desc="Help them find forever" />
          </div>
        </section>

        {/* Action Grid */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Take the first step</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <ActionCard
              icon={<Users className="w-5 h-5" />}
              title="Invite a rescue"
              desc="Bring your local rescue onto Second Tail"
              onClick={() => setShowInviteRescueModal(true)}
            />
            <ActionCard
              icon={<Mail className="w-5 h-5" />}
              title={copied ? 'Copied!' : 'Invite a friend'}
              desc="Know someone who'd make a great foster?"
              onClick={handleCopyInviteLink}
              icon2={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            />
            <ActionCard
              icon={<PawPrint className="w-5 h-5" />}
              title="Browse animals"
              desc={dogs.length > 0 ? `${dogs.length} looking for homes` : 'See who\'s nearby'}
              onClick={scrollToAnimals}
            />
            <ActionCard
              icon={<MessageCircle className="w-5 h-5" />}
              title="Questions?"
              desc="We'd love to hear from you"
              href="mailto:hello@getsecondtail.com"
            />
          </div>
        </section>

        {/* Rescues Near You */}
        <section id="rescues-section">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Rescues near you</h2>
              <p className="text-sm text-gray-600 mt-1">
                Using Second Tail in {stateLabel}
              </p>
            </div>
            {rescues.length > 0 && (
              <button
                onClick={() => setShowInviteRescueModal(true)}
                className="text-sm font-semibold text-[#D76B1A] hover:opacity-80 whitespace-nowrap"
              >
                + Invite another
              </button>
            )}
          </div>
          {rescues.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rescues.map((rescue) => (
                <div key={rescue.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: '#F7E2BD' }}>
                    <Home className="w-5 h-5" style={{ color: '#D76B1A' }} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{rescue.name}</h3>
                  <div className="flex items-center gap-1.5 text-gray-500 mb-4">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs">{rescue.city}, {rescue.state}</span>
                  </div>
                  <button
                    onClick={() => toast.info('Rescue profiles coming soon!')}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#D76B1A] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Say hello
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F7E2BD' }}>
                <PawPrint className="w-8 h-8" style={{ color: '#D76B1A' }} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Be the one who brings a rescue on board
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm sm:text-base">
                No rescues on Second Tail in {stateLabel} yet. Know one that could use better tools? Send them an invite — you'll be the reason a dog finds their next home.
              </p>
              <button
                onClick={() => setShowInviteRescueModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#D76B1A] text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
              >
                Invite a rescue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

        {/* Animals */}
        <section id="animals-section">
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Animals looking for homes</h2>
            <p className="text-sm text-gray-600 mt-1">
              Real adoptable animals in {stateLabel}. Tap one to let their rescue know you found them on Second Tail.
            </p>
          </div>

          {apiLoading ? (
            <div className="flex gap-3 overflow-hidden">
              {[0,1,2,3,4,5].map((i) => (
                <div key={i} className="flex-shrink-0 w-40 sm:w-44 aspect-square rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : apiAnimals.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-0 sm:px-0 snap-x snap-mandatory" style={{ scrollbarWidth: 'thin' }}>
              {apiAnimals.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setSelectedAnimal(a)
                    setShowInviteRescueModal(true)
                  }}
                  className="group flex-shrink-0 w-40 sm:w-44 snap-start text-left"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[#F7E2BD] to-[#FDF6EC] shadow-sm group-hover:shadow-md transition-shadow">
                    {a.photo ? (
                      <img
                        src={a.photo}
                        alt={a.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const t = e.currentTarget as HTMLImageElement
                          t.style.display = 'none'
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PawPrint className="w-12 h-12" style={{ color: '#D76B1A', opacity: 0.4 }} />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/75 via-black/40 to-transparent">
                      <div className="text-white font-bold text-sm truncate">{a.name}</div>
                      <div className="text-white/80 text-[11px] truncate">
                        {[a.breed, a.ageGroup].filter(Boolean).join(' · ') || 'Adoptable'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 px-1">
                    <div className="text-[11px] text-gray-500 truncate">
                      📍 {a.rescue?.name || 'Local rescue'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F7E2BD' }}>
                <Heart className="w-8 h-8" style={{ color: '#D76B1A' }} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No adoptable animals found nearby
              </h3>
              <p className="text-gray-600 max-w-md mx-auto text-sm sm:text-base">
                RescueGroups doesn't have animals listed for {stateLabel} right now. Check back tomorrow — new listings come in constantly.
              </p>
            </div>
          )}
        </section>

        {/* While You Wait */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">While you wait</h2>
            <p className="text-sm text-gray-600 mt-1">A few things that'll make your first foster experience easier</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <TipCard
              icon={<Home className="w-5 h-5" />}
              title="Prepare a cozy space"
              desc="A quiet corner with a bed, water bowl, and soft blankets goes a long way on day one."
            />
            <TipCard
              icon={<ShoppingBag className="w-5 h-5" />}
              title="Stock the basics"
              desc="Leash, collar, and waste bags. Your rescue covers food, meds, and vet care."
            />
            <TipCard
              icon={<Clock className="w-5 h-5" />}
              title="Be patient"
              desc="New environments take a few days. Give them space and they'll come to you."
            />
          </div>
        </section>

      </main>

      <InviteRescueModal
        isOpen={showInviteRescueModal}
        onClose={() => {
          setShowInviteRescueModal(false)
          // Clear the selected animal on close so the next open (e.g. from the
          // "Invite a rescue" top-level button) shows a blank form.
          setSelectedAnimal(null)
        }}
        fosterName={displayName}
        fosterCity={fosterProfile?.city || ''}
        fosterState={fosterProfile?.state || ''}
        prefillOrgName={selectedAnimal?.rescue?.name || undefined}
        prefillEmail={selectedAnimal?.rescue?.email || undefined}
        prefillAnimalName={selectedAnimal?.name || undefined}
      />

      <footer className="border-t border-gray-200 bg-[#D76B1A] py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-xs sm:text-sm text-white/80">
            © 2026 Second Tail. Made with care for rescues and fosters.
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Small presentational components ──

function JourneyStep({ number, title, desc, active }: { number: string; title: string; desc: string; active?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 border transition ${active ? 'border-[#D76B1A] bg-[#FFF8F0]' : 'border-gray-100 bg-gray-50'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-3 ${active ? 'bg-[#D76B1A] text-white' : 'bg-gray-200 text-gray-500'}`}>
        {number}
      </div>
      <h3 className={`font-semibold text-sm mb-1 ${active ? 'text-gray-900' : 'text-gray-700'}`}>{title}</h3>
      <p className="text-xs text-gray-500 leading-snug">{desc}</p>
    </div>
  )
}

function ActionCard({
  icon, icon2, title, desc, onClick, href,
}: {
  icon: React.ReactNode
  icon2?: React.ReactNode
  title: string
  desc: string
  onClick?: () => void
  href?: string
}) {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: '#F7E2BD', color: '#D76B1A' }}>
          {icon}
        </div>
        {icon2 && <div className="text-[#D76B1A]">{icon2}</div>}
      </div>
      <h3 className="font-semibold text-sm text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-snug">{desc}</p>
    </>
  )
  const className = "bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition text-left block"
  if (href) {
    return <a href={href} className={className}>{content}</a>
  }
  return <button onClick={onClick} className={className + " w-full"}>{content}</button>
}

function TipCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl p-5 border border-gray-100" style={{ backgroundColor: '#FDF6EC' }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: '#F7E2BD', color: '#D76B1A' }}>
        {icon}
      </div>
      <h3 className="font-semibold text-sm text-gray-900 mb-1.5">{title}</h3>
      <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
    </div>
  )
}
