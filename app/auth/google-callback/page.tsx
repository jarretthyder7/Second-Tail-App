"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient, createOAuthClient } from "@/lib/supabase/client"

function GoogleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const code = searchParams.get("code")
    if (!code) {
      router.replace("/auth/auth-code-error?error=no_code&error_description=No+auth+code+received")
      return
    }

    ;(async () => {
      try {
        // Exchange the code using the plain supabase-js client, which stored
        // the PKCE verifier in localStorage (survives cross-origin redirects).
        const oauthClient = createOAuthClient()
        const { data, error } = await oauthClient.auth.exchangeCodeForSession(code)

        if (error || !data.session) {
          router.replace(
            `/auth/auth-code-error?error=exchange_failed&error_description=${encodeURIComponent(error?.message ?? "Exchange failed")}`
          )
          return
        }

        // Sync the session into SSR cookies so server components and the
        // middleware can read the authenticated user going forward.
        const ssrClient = createClient()
        await ssrClient.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })

        // Server reads session from cookies, creates the profile if needed,
        // and returns the correct dashboard URL.
        const res = await fetch("/api/auth/finalize-google", { method: "POST" })
        const json = await res.json().catch(() => ({}))
        router.replace(json.redirectTo || "/")
      } catch {
        router.replace("/auth/auth-code-error?error=unknown&error_description=Something+went+wrong")
      }
    })()
  }, [])

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FBF8F4",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #D76B1A",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 1rem",
          }}
        />
        <div style={{ fontSize: "1rem", fontWeight: 600, color: "#1a1a1a" }}>
          Signing you in…
        </div>
        <div style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.25rem" }}>
          Just a moment
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackContent />
    </Suspense>
  )
}
