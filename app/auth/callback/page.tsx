"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * This page handles the implicit OAuth flow where tokens come in the URL hash.
 * The hash (#access_token=...) is never sent to the server, so we need client-side
 * code to extract it and establish the session.
 */
export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Processing authentication...")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      
      // Check if we have hash params (implicit flow)
      const hash = window.location.hash
      if (hash && hash.includes("access_token")) {
        console.log("[v0] Hash-based callback detected, extracting tokens...")
        
        // Parse the hash to extract tokens
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")
        
        if (accessToken) {
          console.log("[v0] Setting session from hash tokens...")
          
          // Set the session using the tokens from the hash
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          })
          
          if (sessionError) {
            console.error("[v0] Failed to set session:", sessionError.message)
            setError(sessionError.message)
            return
          }
          
          if (data.user) {
            console.log("[v0] Session established for user:", data.user.email)
            setStatus("Authentication successful! Redirecting...")
            
            // Call the server-side callback to handle profile creation/routing
            // Pass the user info as query params since we can't use PKCE
            const callbackUrl = new URL("/api/auth/handle-oauth-user", window.location.origin)
            callbackUrl.searchParams.set("user_id", data.user.id)
            
            try {
              const response = await fetch(callbackUrl.toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  user: {
                    id: data.user.id,
                    email: data.user.email,
                    user_metadata: data.user.user_metadata,
                  },
                }),
              })
              
              const result = await response.json()
              
              if (result.redirectTo) {
                router.push(result.redirectTo)
              } else {
                // Default redirect based on user role or to home
                router.push("/")
              }
            } catch (err) {
              console.error("[v0] Error calling handle-oauth-user:", err)
              // Still redirect somewhere reasonable
              router.push("/")
            }
            return
          }
        }
      }
      
      // Check if we have query params (PKCE flow - let the route handler deal with it)
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get("code")
      const tokenHash = searchParams.get("token_hash")
      
      if (code || tokenHash) {
        // This should have been handled by the route.ts, but just in case
        // the page loaded instead, redirect to trigger the route handler
        console.log("[v0] Code/token_hash detected, this should be handled by route.ts")
        setStatus("Processing server-side authentication...")
        // The route.ts handler should have already processed this
        // Wait a moment and check for session
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          router.push("/")
        } else {
          setError("Authentication failed. Please try again.")
        }
        return
      }
      
      // No auth params at all
      if (!hash && !code && !tokenHash) {
        console.error("[v0] No authentication parameters found")
        setError("No authentication parameters found. Please try signing in again.")
      }
    }

    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Authentication Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-full"
          >
            Back to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  )
}
