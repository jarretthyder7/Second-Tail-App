import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const { intent } = await request.json().catch(() => ({}))
  
  // Store the signup intent in a cookie if provided
  if (intent) {
    cookieStore.set("oauth_signup_intent", btoa(JSON.stringify(intent)), {
      path: "/",
      maxAge: 60 * 10, // 10 minutes
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
  }

  // Build the redirect URL - use the request origin or forwarded host
  const forwardedHost = request.headers.get("x-forwarded-host")
  const origin = forwardedHost 
    ? `https://${forwardedHost}` 
    : new URL(request.url).origin
  
  const redirectTo = `${origin}/auth/callback`

  // Create Supabase client that can set cookies for PKCE
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                // Ensure these settings for cross-site cookie persistence
                path: "/",
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
              })
            })
          } catch {
            // Can fail if called from Server Component
          }
        },
      },
    },
  )

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true, // We'll handle the redirect ourselves
    },
  })

  if (error || !data.url) {
    console.error("[v0] OAuth initiation failed:", error?.message)
    return NextResponse.json(
      { error: error?.message || "Failed to initiate OAuth" },
      { status: 500 }
    )
  }

  // Return the OAuth URL - the client will redirect to it
  return NextResponse.json({ url: data.url })
}
