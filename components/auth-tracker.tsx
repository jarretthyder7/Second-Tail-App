'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import posthog from 'posthog-js'

/**
 * Subscribes to Supabase auth state and identifies the user in PostHog.
 * Fires a logout event on sign-out.
 *
 * Login and signup events are captured at the form submit level (see
 * login/signup pages) — this component only handles identity linking so
 * every subsequent event is attached to the right distinct_id.
 */
export function AuthTracker() {
  useEffect(() => {
    const supabase = createClient()
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      try {
        if (
          (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') &&
          session?.user
        ) {
          posthog.identify(session.user.id, {
            email: session.user.email,
          })
          // Enrich with role — non-blocking
          supabase
            .from('profiles')
            .select('role, org_role, organization_id')
            .eq('id', session.user.id)
            .maybeSingle()
            .then(({ data: p }) => {
              if (p && posthog.people) {
                posthog.people.set({
                  role: p.role,
                  org_role: p.org_role,
                  organization_id: p.organization_id,
                })
              }
            })
        } else if (event === 'SIGNED_OUT') {
          try {
            posthog.capture('user_logged_out')
            posthog.reset()
          } catch {}
        }
      } catch {}
    })
    return () => {
      sub?.subscription?.unsubscribe()
    }
  }, [])

  return null
}
