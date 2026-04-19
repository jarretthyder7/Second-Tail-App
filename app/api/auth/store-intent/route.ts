import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { intent } = await request.json()
    if (!intent) return NextResponse.json({ error: "No intent provided" }, { status: 400 })

    const response = NextResponse.json({ ok: true })
    // Store the base64 signup intent in a short-lived cookie so the
    // auth callback can read it server-side after the OAuth redirect chain.
    response.cookies.set("oauth_signup_intent", intent, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes — plenty of time to complete Google OAuth
      path: "/",
    })
    return response
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
