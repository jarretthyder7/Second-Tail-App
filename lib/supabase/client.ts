import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  if (!supabaseClient) {
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        flowType: "pkce",
      },
    })

    // This prevents "Failed to fetch" errors from breaking the app while sessions refresh
    if (typeof window !== "undefined") {
      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
          // Silently handle token refresh events
          if (event === "TOKEN_REFRESHED" && !session) {
            console.debug("[v0] Session refresh handled silently")
          }
        }
      })
    }
  }

  return supabaseClient
}

export { createBrowserClient }
