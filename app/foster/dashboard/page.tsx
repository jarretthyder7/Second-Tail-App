'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Copy, Check, LogOut, MapPin, Heart, PawPrint, Users, Mail,
  Sparkles, ArrowRight, Home, ShoppingBag, Clock, MessageCircle,
  Menu, X, User, Settings, ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { InviteRescueModal } from '@/app/components/foster/invite-rescue-modal'
import { AnimalProfileModal } from '@/app/components/foster/animal-profile-modal'

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
  const [showAnimalModal, setShowAnimalModal] = useState(false)
  const [speciesFilter, setSpeciesFilter] = useState<'both' | 'dog' | 'cat'>('both')
  const [zipInput, setZipInput] = useState('')
  const [radius, setRadius] = useState(50)
  const [menuOpen, setMenuOpen] = useState(false)
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

          // Seed ZIP from localStorage (set when they used the input before)
          try {
            const savedZip = localStorage.getItem('foster_zip') || ''
            if (/^\d{5}$/.test(savedZip)) setZipInput(savedZip)
          } catch {}
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

  // Fetch animals whenever ZIP, radius, or the foster's state changes.
  useEffect(() => {
    const state = fosterProfile?.state
    if (!state && !zipInput) return // nothing to query yet
    setApiLoading(true)
    const params = new URLSearchParams()
    if (/^\d{5}$/.test(zipInput)) {
      params.set('zip', zipInput)
      params.set('radius', String(radius))
    }
    if (state) params.set('state', state)
    params.set('species', speciesFilter)
    params.set('limit', '12')

    // Debounce ZIP typing
    const handle = setTimeout(() => {
      fetch(`/api/rescue-animals?${params.toString()}`)
        .then((r) => r.json())
        .then((j) => {
          if (j?.ok && Array.isArray(j.animals)) setApiAnimals(j.animals)
          else setApiAnimals([])
        })
        .catch(() => setApiAnimals([]))
        .finally(() => setApiLoading(false))
    }, 300)
    return () => clearTimeout(handle)
  }, [fosterProfile?.state, zipInput, radius, speciesFilter])

  // Persist ZIP to localStorage on change
  useEffect(() => {
    if (/^\d{5}$/.test(zipInput)) {
      try { localStorage.setItem('foster_zip', zipInput) } catch {}
    }
  }, [zipInput])

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
      <header className="bg-white shadow-sm border-b border-gray-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Second Tail
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu dropdown */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-4 sm:right-8 top-full mt-2 z-40 w-64 rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-[#FDF6EC]">
                <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <nav className="py-1">
                <a
                  href="#animals-section"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Heart className="w-4 h-4 text-[#D76B1A]" />
                  Browse animals
                </a>
                <a
                  href="#rescues-section"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <PawPrint className="w-4 h-4 text-[#D76B1A]" />
                  Rescues near you
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    setShowInviteRescueModal(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
                >
                  <Mail className="w-4 h-4 text-[#D76B1A]" />
                  Invite a rescue
                </button>
                <a
                  href="/rescuespinner"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Sparkles className="w-4 h-4 text-[#D76B1A]" />
                  Rescue spinner
                  <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
                </a>
                <div className="border-t border-gray-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
                >
                  <LogOut className="w-4 h-4 text-gray-500" />
                  Log out
                </button>
              </nav>
            </div>
          </>
        )}
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

        {/* Animals */}
        <section id="animals-section">
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Animals looking for homes</h2>
            <p className="text-sm text-gray-600 mt-1">
              Tap one to let their rescue know you'd love to foster them.
            </p>
          </div>

          {/* Species selector */}
          <div className="flex gap-2 mb-3">
            {(['both', 'dog', 'cat'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSpeciesFilter(opt)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  speciesFilter === opt
                    ? 'bg-[#D76B1A] text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-[#D76B1A]/50'
                }`}
              >
                {opt === 'both' ? '🐾 All' : opt === 'dog' ? '🐕 Dogs' : '🐈 Cats'}
              </button>
            ))}
          </div>

          {/* ZIP + radius controls */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
              <div className="sm:w-32">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Your ZIP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 10075"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A]"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-600">Within</label>
                  <span className="text-xs font-semibold text-[#D76B1A]">{radius} miles</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value, 10))}
                  disabled={!/^\d{5}$/.test(zipInput)}
                  className="w-full accent-[#D76B1A] disabled:opacity-40"
                />
              </div>
            </div>
            {!/^\d{5}$/.test(zipInput) && (
              <p className="text-[11px] text-gray-400 mt-2">
                Enter a 5-digit ZIP to refine results by distance. Otherwise showing animals from rescues in {stateLabel}.
              </p>
            )}
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
                    setShowAnimalModal(true)
                  }}
                  className="group flex-shrink-0 w-40 sm:w-44 snap-start text-left"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[#F7E2BD] to-[#FDF6EC] border-2 border-[#4A3C36]/25 shadow-sm group-hover:shadow-md group-hover:border-[#4A3C36]/45 transition-all">
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
                    <div
                      className="absolute bottom-1.5 left-2 text-[9px] font-medium text-white/75"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                    >
                      via rescuegroups.org
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
                No adoptable animals in range right now
              </h3>
              <p className="text-gray-600 max-w-md mx-auto text-sm sm:text-base">
                Try widening the radius above, or check back tomorrow — new listings come in constantly.
              </p>
            </div>
          )}
        </section>

        {/* Rescues Near You */}
        <section id="rescues-section">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Rescues on Second Tail near you</h2>
              <p className="text-sm text-gray-600 mt-1">
                Rescues in {stateLabel} actively using Second Tail
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
                No rescues in {stateLabel} are using Second Tail yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm sm:text-base">
                That&apos;s why this is empty. The animals above come from rescues not yet on Second Tail — reach out to one and invite them. You&apos;ll be the reason a dog finds their next home.
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

        {/* Preview of what unlocks when matched */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">When you get matched</h2>
            <p className="text-sm text-gray-600 mt-1">
              Here's what your dashboard looks like once a rescue matches you with an animal.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <UnlockCard icon={<Heart className="w-5 h-5" />} title="Your foster's profile" desc="Photo, breed, medical, behavior — all in one place." />
            <UnlockCard icon={<MessageCircle className="w-5 h-5" />} title="Message your rescue" desc="Direct line to the rescue for any question." />
            <UnlockCard icon={<ShoppingBag className="w-5 h-5" />} title="Request supplies" desc="Food, toys, meds — the rescue ships to you." />
            <UnlockCard icon={<Clock className="w-5 h-5" />} title="Schedule appointments" desc="Vet visits, meet & greets, adoption days." />
          </div>
        </section>

      </main>

      <AnimalProfileModal
        isOpen={showAnimalModal}
        onClose={() => {
          setShowAnimalModal(false)
          setSelectedAnimal(null)
        }}
        animal={selectedAnimal}
        foster={{
          name: displayName,
          email: user?.email || '',
          city: fosterProfile?.city || '',
          state: fosterProfile?.state || '',
        }}
      />

      <InviteRescueModal
        isOpen={showInviteRescueModal}
        onClose={() => setShowInviteRescueModal(false)}
        fosterName={displayName}
        fosterCity={fosterProfile?.city || ''}
        fosterState={fosterProfile?.state || ''}
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

function UnlockCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="relative rounded-2xl p-5 bg-white border border-gray-100 opacity-80">
      <div className="absolute top-3 right-3 text-gray-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: '#F7E2BD', color: '#D76B1A' }}>
        {icon}
      </div>
      <h3 className="font-semibold text-sm text-gray-900 mb-1.5">{title}</h3>
      <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
    </div>
  )
}
