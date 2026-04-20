"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

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
        // Exchange the code in the browser — the PKCE verifier is in browser
        // storage here (where signInWithOAuth put it), not server cookies.
        const supabase = createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          router.replace(
            `/auth/auth-code-error?error=exchange_failed&error_description=${encodeURIComponent(error.message)}`
          )
          return
        }

        // Session is now in browser cookies. Server reads it to create the
        // profile and return the correct dashboard URL.
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
