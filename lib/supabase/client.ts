import { createBrowserClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Use this client ONLY for Google OAuth signInWithOAuth and exchangeCodeForSession.
// The plain supabase-js client stores the PKCE code verifier in localStorage,
// which reliably survives the cross-origin Google redirect. The @supabase/ssr
// cookie-based storage does not.
export function createOAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.")
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

export { createBrowserClient }
