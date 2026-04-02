import { createClient } from "@/lib/supabase/client"

export async function fosterLogin(email: string, password: string) {
  const supabase = createClient()

  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { error: signInError.message }
  }

  if (!data.user) {
    return { error: "Unable to log in. Please try again." }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", data.user.id)
    .single()

  if (profileError || !profile) {
    return {
      error: `Unable to load user profile: ${profileError?.message ?? "no profile row found"} (code: ${profileError?.code})`,
    }
  }

  if (profile.role !== "foster") {
    return { error: "This account is not a foster account. Please use Rescue Team Login." }
  }

  const redirectTo = profile.organization_id
    ? `/org/${profile.organization_id}/foster/dashboard`
    : "/foster/dashboard"

  return { redirectTo }
}
