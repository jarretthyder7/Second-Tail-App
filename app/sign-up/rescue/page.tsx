'use client'

import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'

export default function RescueWaitlistPage() {
  const [form, setForm] = useState({
    orgName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    website: '',
    howHeard: '',
    notes: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.orgName.trim() || !form.contactName.trim() || !form.email.trim()) {
      setStatus('error')
      setErrorMsg('Organization name, your name, and email are required.')
      return
    }
    setStatus('submitting')
    try {
      const res = await fetch('/api/rescue-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('success')
        try {
          const ph = (window as any).posthog
          if (ph?.capture) {
            ph.capture('rescue_waitlist_submitted', {
              state: form.state,
              city: form.city,
              has_website: !!form.website,
              how_heard: form.howHeard || null,
            })
          }
        } catch {}
      } else {
        const data = await res.json().catch(() => ({}))
        setStatus('error')
        setErrorMsg(data?.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <SiteHeader />

      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-lg mx-auto">
          <div className="bg-[#FDF6EC] rounded-2xl shadow-lg p-6 sm:p-8">
            {status === 'success' ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">You're on the list.</h1>
                <p className="text-muted-foreground">
                  We'll be in touch within a few days to onboard your rescue personally. During beta we work with each org directly so we can learn from you.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-foreground">Join as a Rescue</h1>
                  <p className="text-sm text-muted-foreground mt-2">
                    We're onboarding rescues personally during beta — leave your info and we'll reach out within a few days. No credit card, no commitment, free while we're in beta.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Rescue / Organization name *
                    </label>
                    <input
                      type="text"
                      value={form.orgName}
                      onChange={update('orgName')}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Your name *
                    </label>
                    <input
                      type="text"
                      value={form.contactName}
                      onChange={update('contactName')}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={update('email')}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={update('city')}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={update('state')}
                        placeholder="e.g. CO"
                        maxLength={2}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Rescue website (optional)
                    </label>
                    <input
                      type="url"
                      value={form.website}
                      onChange={update('website')}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      How did you hear about us? (optional)
                    </label>
                    <select
                      value={form.howHeard}
                      onChange={update('howHeard')}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select...</option>
                      <option value="foster">A foster told us</option>
                      <option value="social">Social media</option>
                      <option value="rescuespinner">Rescue Spinner</option>
                      <option value="referral">Another rescue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Anything else? (optional)
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={update('notes')}
                      rows={3}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Questions, what you're hoping to get out of Second Tail, anything you want us to know..."
                    />
                  </div>

                  {status === 'error' && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full rounded-full bg-primary px-4 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'submitting' ? 'Sending...' : 'Join the waitlist'}
                  </button>

                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Already invited?{' '}
                    <a href="/login/rescue" className="text-primary font-medium hover:underline">
                      Sign in here
                    </a>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
