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
  
  // Use the hash-based callback for implicit flow (handles access_token in URL hash)
  const redirectTo = `${origin}/auth/callback`

  // Build the OAuth URL manually using implicit flow (no PKCE)
  // This avoids the code_verifier cookie issue entirely
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  
  const params = new URLSearchParams({
    provider: "google",
    redirect_to: redirectTo,
  })

  const oauthUrl = `${supabaseUrl}/auth/v1/authorize?${params.toString()}`

  // Return the OAuth URL - the client will redirect to it
  return NextResponse.json({ url: oauthUrl })
}
