'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface InviteRescueModalProps {
  isOpen: boolean
  onClose: () => void
  fosterName: string
  fosterCity: string
  fosterState: string
  /** Optional prefill — used when foster clicks a specific animal/rescue card. */
  prefillOrgName?: string
  prefillEmail?: string
  prefillMessage?: string
  prefillAnimalName?: string
}

export function InviteRescueModal({
  isOpen,
  onClose,
  fosterName,
  fosterCity,
  fosterState,
  prefillOrgName,
  prefillEmail,
  prefillMessage,
  prefillAnimalName,
}: InviteRescueModalProps) {
  const [orgName, setOrgName] = useState('')
  const [rescueEmail, setRescueEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Refresh prefilled fields whenever modal opens with new context.
  useEffect(() => {
    if (!isOpen) return
    setOrgName(prefillOrgName || '')
    setRescueEmail(prefillEmail || '')
    const defaultMsg = prefillAnimalName
      ? `Hi! I'm ${fosterName || 'a foster-to-be'}${fosterCity || fosterState ? ` in ${[fosterCity, fosterState].filter(Boolean).join(', ')}` : ''}. I saw ${prefillAnimalName} on Second Tail, a free tool that helps rescues manage fosters. I'd love to foster with you — and Second Tail would make the process easier for both of us.`
      : (prefillMessage || '')
    setMessage(defaultMsg)
    setStatus('idle')
    setErrorMsg('')
  }, [isOpen, prefillOrgName, prefillEmail, prefillMessage, prefillAnimalName, fosterName, fosterCity, fosterState])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus('idle')

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'rescue-invite-from-foster',
          rescueEmail,
          rescueName: orgName,
          fosterName,
          fosterCity,
          fosterState,
          customMessage: message || undefined,
        }),
      })

      if (response.ok) {
        setStatus('success')
        setOrgName('')
        setRescueEmail('')
        setMessage('')
        setTimeout(() => {
          onClose()
          setStatus('idle')
        }, 2000)
      } else {
        setStatus('error')
        setErrorMsg('Something went wrong. Please try again.')
      }
    } catch (error) {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again.')
      console.error('Error sending invite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Invite a Rescue</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'success' ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-900 font-semibold">Invite sent! Thanks for spreading the word.</p>
            </div>
          ) : status === 'error' ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-gray-900 font-semibold">{errorMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Rescue organization name */}
              <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Rescue organization name <span className="text-red-500">*</span>
                </label>
                <input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Happy Paws Rescue"
                />
              </div>

              {/* Rescue email */}
              <div>
                <label htmlFor="rescueEmail" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Rescue email <span className="text-red-500">*</span>
                </label>
                <input
                  id="rescueEmail"
                  type="email"
                  value={rescueEmail}
                  onChange={(e) => setRescueEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="contact@rescueorg.com"
                />
              </div>

              {/* Optional message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Optional message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Tell them why they should join Second Tail"
                  rows={3}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-full font-semibold transition-colors"
                >
                  {isLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
