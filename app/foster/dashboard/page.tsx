'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Copy, Check, LogOut, MapPin, Heart } from 'lucide-react'
import { toast } from 'sonner'

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
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          router.push('/login/foster')
          return
        }
        setUser(currentUser)

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (profileError) throw profileError
        setProfile(profileData)

        // If already connected to an org, redirect
        if (profileData?.organization_id) {
          router.push(`/org/${profileData.organization_id}/foster/dashboard`)
          return
        }

        // Get foster profile for city and state
        const { data: fosterData, error: fosterError } = await supabase
          .from('foster_profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .single()

        if (fosterError && fosterError.code !== 'PGRST116') throw fosterError
        if (fosterData) {
          setFosterProfile(fosterData)

          // Get rescues in the same state
          const { data: rescueData, error: rescueError } = await supabase
            .from('organizations')
            .select('id, name, city, state')
            .eq('state', fosterData.state)
            .eq('verified', true)

          if (rescueError) throw rescueError
          setRescues(rescueData || [])

          // Get available dogs in the same state
          const { data: dogsData, error: dogsError } = await supabase
            .from('dogs')
            .select('id, name, breed, size, organization_id')
            .eq('public_listing', true)
            .in('organization_id', rescueData?.map(r => r.id) || [])

          if (dogsError) throw dogsError
          setDogs(dogsData || [])
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

  const handleCopyLink = () => {
    const link = `${window.location.origin}/foster-profile/${user?.id}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Profile link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInterestedInDog = (dogName: string) => {
    toast.success(`We'll let the rescue know you're interested in ${dogName}!`)
  }

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
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Banner */}
        <div className="bg-[#D76B1A] text-white rounded-2xl p-8 mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Welcome, {profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-white/90 text-lg">
            You're on the Second Tail foster network. Connect with a rescue in your area to get started.
          </p>
        </div>

        {/* Connect with a Rescue Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Connect with a Rescue</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Invite Card */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Invite a Rescue</h3>
              <p className="text-gray-600 mb-6">
                Know a rescue that needs better tools? Invite them to Second Tail.
              </p>
              <button
                onClick={() => toast.info('Invite feature coming soon!')}
                className="inline-block px-6 py-3 bg-[#D76B1A] text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
              >
                Send an Invite
              </button>
            </div>

            {/* Share Profile Card */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Share Your Profile</h3>
              <p className="text-gray-600 mb-6">
                Share your foster profile link with local rescues.
              </p>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#D76B1A] text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Rescues Near You Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Rescues Near You
          </h2>
          <p className="text-gray-600 mb-6">
            Rescue organizations using Second Tail in {fosterProfile?.state}
          </p>
          {rescues.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rescues.map((rescue) => (
                <div key={rescue.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{rescue.name}</h3>
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{rescue.city}, {rescue.state}</span>
                  </div>
                  <button
                    onClick={() => toast.info('Rescue profile coming soon!')}
                    className="inline-block px-4 py-2 border-2 border-[#D76B1A] text-[#D76B1A] rounded-full font-semibold hover:bg-orange-50 transition-colors"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
              <p className="text-gray-600">
                No rescues in your area yet — invite one above!
              </p>
            </div>
          )}
        </section>

        {/* Animals Available Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Animals Looking for Foster Homes
          </h2>
          <p className="text-gray-600 mb-6">
            Animals available for fostering near you
          </p>
          {dogs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dogs.map((dog) => (
                <div key={dog.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{dog.name}</h3>
                  <div className="space-y-2 text-gray-600 text-sm mb-4">
                    <p><strong>Breed:</strong> {dog.breed}</p>
                    <p><strong>Size:</strong> {dog.size}</p>
                  </div>
                  <button
                    onClick={() => handleInterestedInDog(dog.name)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#D76B1A] text-white rounded-full font-semibold hover:opacity-90 transition-opacity w-full justify-center"
                  >
                    <Heart className="w-4 h-4" />
                    I&apos;m Interested
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
              <p className="text-gray-600">
                Check back soon as more rescues join!
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
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
