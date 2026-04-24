'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  PawPrint, Heart, Mail, Users,
} from 'lucide-react'
import { AnimalProfileModal } from '@/app/components/foster/animal-profile-modal'
import { InviteRescueModal } from '@/app/components/foster/invite-rescue-modal'

export default function FosterExplorePage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [fosterProfile, setFosterProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [apiAnimals, setApiAnimals] = useState<any[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [selectedAnimal, setSelectedAnimal] = useState<any | null>(null)
  const [showAnimalModal, setShowAnimalModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const [speciesFilter, setSpeciesFilter] = useState<'both' | 'dog' | 'cat'>('both')
  const [zipInput, setZipInput] = useState('')
  const [radius, setRadius] = useState(50)

  useEffect(() => {
    const load = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login/foster')
        return
      }
      setUser(authUser)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
      setProfile(p)
      const { data: fp } = await supabase.from('foster_profiles').select('*').eq('user_id', authUser.id).maybeSingle()
      setFosterProfile(fp)
      try {
        const savedZip = localStorage.getItem('foster_zip') || ''
        if (/^\d{5}$/.test(savedZip)) setZipInput(savedZip)
      } catch {}
      setLoading(false)
    }
    load()
  }, [router, supabase])

  // Fetch animals when filters change
  useEffect(() => {
    const state = fosterProfile?.state
    if (!state && !zipInput) return
    setApiLoading(true)
    const params = new URLSearchParams()
    if (/^\d{5}$/.test(zipInput)) {
      params.set('zip', zipInput)
      params.set('radius', String(radius))
    }
    if (state) params.set('state', state)
    params.set('species', speciesFilter)
    params.set('limit', '24')

    const t = setTimeout(() => {
      fetch(`/api/rescue-animals?${params.toString()}`)
        .then((r) => r.json())
        .then((j) => {
          if (j?.ok && Array.isArray(j.animals)) setApiAnimals(j.animals)
          else setApiAnimals([])
        })
        .catch(() => setApiAnimals([]))
        .finally(() => setApiLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [fosterProfile?.state, zipInput, radius, speciesFilter])

  useEffect(() => {
    if (/^\d{5}$/.test(zipInput)) {
      try { localStorage.setItem('foster_zip', zipInput) } catch {}
    }
  }, [zipInput])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF6EC]">
        <p className="text-[#5A4A42]/60">Loading…</p>
      </div>
    )
  }

  const displayName = profile?.full_name || profile?.name || ''
  const stateLabel = fosterProfile?.state || 'your area'

  return (
    <div className="min-h-screen bg-[#FDF6EC]">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 md:pb-10 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Explore nearby animals</h1>
          <p className="text-sm text-gray-600 mt-1">
            Real adoptable dogs and cats from rescues near you — while you wait to be matched.
            Tap one to send their rescue a message.
          </p>
        </div>

        {/* Species */}
        <div className="flex gap-2">
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

        {/* ZIP + radius */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
            <div className="sm:w-32">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your ZIP</label>
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
              Enter a 5-digit ZIP to refine by distance. Otherwise showing animals from rescues in {stateLabel}.
            </p>
          )}
        </div>

        {/* Animals grid */}
        {apiLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[0,1,2,3,4,5,6,7].map((i) => (
              <div key={i} className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : apiAnimals.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {apiAnimals.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setSelectedAnimal(a)
                  setShowAnimalModal(true)
                }}
                className="group text-left"
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
            <h3 className="text-lg font-bold text-gray-900 mb-2">No adoptable animals in range right now</h3>
            <p className="text-gray-600 max-w-md mx-auto text-sm sm:text-base">
              Try widening the radius above, or check back tomorrow — new listings come in constantly.
            </p>
          </div>
        )}

        {/* Invite a specific rescue */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F7E2BD' }}>
              <Users className="w-5 h-5" style={{ color: '#D76B1A' }} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Know a specific rescue?</h3>
              <p className="text-sm text-gray-600 mt-1 mb-3">
                Invite a rescue to join Second Tail so you can foster for them through the app.
              </p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#D76B1A] text-white rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Mail className="w-4 h-4" />
                Invite a rescue
              </button>
            </div>
          </div>
        </div>
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
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        fosterName={displayName}
        fosterCity={fosterProfile?.city || ''}
        fosterState={fosterProfile?.state || ''}
      />
    </div>
  )
}
