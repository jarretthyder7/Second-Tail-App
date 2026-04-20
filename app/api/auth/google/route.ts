import { NextResponse, type NextRequest } from "next/server"
import { cookies } from "next/headers"

// Stores the signup intent cookie so the auth callback can read it after the
// OAuth round-trip. OAuth itself is now initiated client-side by the browser
// Supabase SDK, which stores the PKCE verifier in browser cookies reliably.
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const { intent } = await request.json().catch(() => ({}))

  if (intent) {
    cookieStore.set("oauth_signup_intent", btoa(JSON.stringify(intent)), {
      path: "/",
      maxAge: 60 * 10,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
  }

  return NextResponse.json({ ok: true })
}
