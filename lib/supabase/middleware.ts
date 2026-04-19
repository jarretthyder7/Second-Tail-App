import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// 7 days in seconds for session persistence
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 604800 seconds

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              maxAge: COOKIE_MAX_AGE,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            }),
          )
        },
      },
    },
  )

  // IMPORTANT: Do not add any code between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect org and foster routes — redirect to the right login if unauthenticated
  const isFosterPath = request.nextUrl.pathname.startsWith("/foster/")
  const isOrgPath = request.nextUrl.pathname.startsWith("/org/")

  if ((isFosterPath || isOrgPath) && !user) {
    const url = request.nextUrl.clone()
    // Send to the relevant login page with context instead of silently dumping on homepage
    url.pathname = isFosterPath ? "/login/foster" : "/login/rescue"
    url.searchParams.set("message", "Please sign in to continue")
    return NextResponse.redirect(url)
  }

  // IMPORTANT: return supabaseResponse as-is so cookies are properly forwarded
  return supabaseResponse
}
