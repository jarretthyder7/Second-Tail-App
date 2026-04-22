'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { PostHogProvider as PHSDKProvider } from 'posthog-js/react'
import posthog from 'posthog-js'
import { AuthTracker } from './auth-tracker'

function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname || typeof window === 'undefined') return
    let url = window.origin + pathname
    const qs = searchParams?.toString()
    if (qs) url += '?' + qs
    try {
      posthog?.capture?.('$pageview', { $current_url: url })
    } catch {}
  }, [pathname, searchParams])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host =
      process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com'
    if (!key) return
    try {
      posthog.init(key, {
        api_host: host,
        person_profiles: 'identified_only',
        capture_pageview: false,
        capture_pageleave: true,
      })
    } catch {}
  }, [])

  return (
    <PHSDKProvider client={posthog}>
      <AuthTracker />
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </PHSDKProvider>
  )
}
