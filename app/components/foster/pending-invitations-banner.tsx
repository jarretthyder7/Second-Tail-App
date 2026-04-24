'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface Invitation {
  id: string
  organization_id: string
  created_at: string
  organizations: { name: string; city: string | null; state: string | null } | null
}

export function PendingInvitationsBanner() {
  const router = useRouter()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/foster/invitations', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        if (!cancelled && Array.isArray(json?.invitations)) {
          setInvitations(json.invitations)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleAccept = async (id: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/foster/invitations/${id}/accept`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Could not accept invitation')
        return
      }
      toast.success('Invitation accepted!')
      router.push(json.redirectTo || `/org/${json.organization_id}/foster/dashboard`)
    } catch {
      toast.error('Could not accept invitation')
    } finally {
      setBusyId(null)
    }
  }

  const handleDecline = async (id: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/foster/invitations/${id}/decline`, { method: 'POST' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json?.error || 'Could not decline invitation')
        return
      }
      setInvitations((prev) => prev.filter((inv) => inv.id !== id))
      toast.success('Invitation declined')
    } catch {
      toast.error('Could not decline invitation')
    } finally {
      setBusyId(null)
    }
  }

  if (loading || invitations.length === 0) return null

  return (
    <div className="space-y-3">
      {invitations.map((inv) => {
        const orgName = inv.organizations?.name || 'A rescue organization'
        const orgLocation = [inv.organizations?.city, inv.organizations?.state]
          .filter(Boolean)
          .join(', ')
        const isBusy = busyId === inv.id
        return (
          <div
            key={inv.id}
            className="bg-white border border-[#D76B1A]/20 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-[#FDF6EC] flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-[#D76B1A]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-semibold text-gray-900">
                  {orgName} invited you to foster
                </p>
                {orgLocation && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{orgLocation}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 sm:flex-shrink-0">
              <button
                type="button"
                onClick={() => handleDecline(inv.id)}
                disabled={isBusy}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Decline
              </button>
              <button
                type="button"
                onClick={() => handleAccept(inv.id)}
                disabled={isBusy}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white bg-[#D76B1A] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
