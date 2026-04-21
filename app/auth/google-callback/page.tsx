"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient, createOAuthClient } from "@/lib/supabase/client"

/**
 * Client-side OAuth callback. Handles two cases:
 *
 *   1. Implicit flow — Supabase returns tokens in the URL hash fragment
 *      (#access_token=...&refresh_token=...). We parse them and call
 *      setSession directly. Hash fragments are client-only, which is why
 *      this has to run in the browser, not in a server route handler.
 *
 *   2. PKCE flow — Supabase returns ?code=... in the query string. We
 *      exchange the code for a session using the plain supabase-js client,
 *      which stored the code verifier in localStorage during sign-in.
 *
 * In both cases we then call /api/auth/finalize-google to create the
 * profile (if needed) and return the correct dashboard redirect URL.
 */
function GoogleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    ;(async () => {
      try {
        // ── Case 1: Implicit flow (tokens in hash fragment) ──
        const hash = typeof window !== "undefined" ? window.location.hash : ""
        if (hash && hash.includes("access_token=")) {
          const hashParams = new URLSearchParams(hash.replace(/^#/, ""))
          const access_token = hashParams.get("access_token")
          const refresh_token = hashParams.get("refresh_token")
          const hashError = hashParams.get("error")
          const hashErrorDesc = hashParams.get("error_description")

          if (hashError) {
            router.replace(
              `/auth/auth-code-error?error=${encodeURIComponent(hashError)}&error_description=${encodeURIComponent(hashErrorDesc || "OAuth failed")}`
            )
            return
          }

          if (!access_token || !refresh_token) {
            router.replace("/auth/auth-code-error?error=missing_tokens&error_description=OAuth+response+was+missing+tokens")
            return
          }

          const ssrClient = createClient()
          const { error: setErr } = await ssrClient.auth.setSession({
            access_token,
            refresh_token,
          })
          if (setErr) {
            router.replace(
              `/auth/auth-code-error?error=set_session_failed&error_description=${encodeURIComponent(setErr.message)}`
            )
            return
          }

          // Clean the hash so the tokens don't stay visible in the address bar
          window.history.replaceState(null, "", window.location.pathname + window.location.search)

          const res = await fetch("/api/auth/finalize-google", { method: "POST" })
          const json = await res.json().catch(() => ({}))
          router.replace(json.redirectTo || "/")
          return
        }

        // ── Case 2: PKCE flow (?code=...) ──
        const code = searchParams.get("code")
        const queryError = searchParams.get("error")
        const queryErrorDesc = searchParams.get("error_description")

        if (queryError) {
          router.replace(
            `/auth/auth-code-error?error=${encodeURIComponent(queryError)}&error_description=${encodeURIComponent(queryErrorDesc || "OAuth failed")}`
          )
          return
        }

        if (!code) {
          router.replace("/auth/auth-code-error?error=no_code&error_description=No+auth+code+received")
          return
        }

        const oauthClient = createOAuthClient()
        const { data, error } = await oauthClient.auth.exchangeCodeForSession(code)

        if (error || !data.session) {
          router.replace(
            `/auth/auth-code-error?error=exchange_failed&error_description=${encodeURIComponent(error?.message ?? "Exchange failed")}`
          )
          return
        }

        const ssrClient = createClient()
        await ssrClient.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })

        const res = await fetch("/api/auth/finalize-google", { method: "POST" })
        const json = await res.json().catch(() => ({}))
        router.replace(json.redirectTo || "/")
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong"
        router.replace(`/auth/auth-code-error?error=unknown&error_description=${encodeURIComponent(msg)}`)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
