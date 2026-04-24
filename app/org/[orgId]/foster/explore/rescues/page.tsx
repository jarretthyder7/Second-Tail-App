'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, PawPrint, MapPin, Users, Mail } from 'lucide-react'
import { InviteRescueModal } from '@/app/components/foster/invite-rescue-modal'

interface Rescue {
  id: string
  name: string
  city: string | null
  state: string | null
}

export default function FosterRescuesExplorePage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [fosterProfile, setFosterProfile] = useState<any>(null)
  const [rescues, setRescues] = useState<Rescue[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)

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

      // Load all verified rescues in this foster's state (excluding their own org).
      const state = fp?.state
      if (state) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name, city, state')
          .eq('state', state)
          .eq('verified', true)
          .neq('id', orgId) // exclude the foster's current rescue
          .order('name')
        setRescues(orgs || [])
      } else {
        setRescues([])
      }
      setLoading(false)
    }
    load()
  }, [router, supabase, orgId])

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Explore nearby rescues</h1>
          <p className="text-sm text-gray-600 mt-1">
            Rescues in {stateLabel} already on Second Tail. Tap one to introduce yourself.
          </p>
        </div>

        {rescues.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {rescues.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl overflow-hidden border-2 border-[#4A3C36]/25 shadow-sm hover:shadow-md hover:border-[#4A3C36]/45 transition-all"
              >
                <div
                  className="aspect-square flex items-center justify-center relative"
                  style={{ background: 'linear-gradient(135deg, #FDF6EC 0%, #F7E2BD 100%)' }}
                >
                  <Home className="w-12 h-12" style={{ color: '#D76B1A', opacity: 0.5 }} />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/75 via-black/40 to-transparent">
                    <div className="text-white font-bold text-sm truncate">{r.name}</div>
                    {(r.city || r.state) && (
                      <div className="text-white/80 text-[11px] truncate">
                        {[r.city, r.state].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-[#2E7D32] text-[9.5px] font-bold tracking-wide shadow-sm">
                    ✨ On Second Tail
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F7E2BD' }}>
              <PawPrint className="w-8 h-8" style={{ color: '#D76B1A' }} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No other rescues in {stateLabel} are on Second Tail yet
            </h3>
            <p className="text-gray-600 max-w-md mx-auto text-sm sm:text-base mb-4">
              You&apos;re early — as rescues join, they&apos;ll show up here. Know one that should be on Second Tail?
            </p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#D76B1A] text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
            >
              <Mail className="w-4 h-4" />
              Invite a rescue
            </button>
          </div>
        )}

        {/* Always-on invite card below the grid */}
        {rescues.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#F7E2BD' }}
              >
                <Users className="w-5 h-5" style={{ color: '#D76B1A' }} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Know a rescue not listed here?</h3>
                <p className="text-sm text-gray-600 mt-1 mb-3">
                  Invite them to join Second Tail so you can foster for them through the app.
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
        )}
      </main>

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
