"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "./supabase/client"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ("foster" | "rescue")[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      console.log("[v0] ProtectedRoute check:", { allowedRoles })

      if (userError || !user) {
        console.log("[v0] No user found, redirecting to login")
        router.push("/login")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, organization_id")
        .eq("id", user.id)
        .single()

      if (profileError || !profile) {
        console.log("[v0] Profile error:", profileError)
        router.push("/login")
        return
      }

      console.log("[v0] User profile:", { email: user.email, role: profile.role, allowedRoles })

      if (allowedRoles && !allowedRoles.includes(profile.role as "foster" | "rescue")) {
        console.log("[v0] Role not allowed, redirecting")
        if (profile.role === "foster") {
          if (profile.organization_id) {
            router.push(`/org/${profile.organization_id}/foster/dashboard`)
          } else {
            router.push("/foster/dashboard")
          }
        } else {
          router.push(profile.organization_id ? `/org/${profile.organization_id}/admin/dashboard` : "/login/rescue")
        }
        return
      }

      setIsAuthorized(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [allowedRoles, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FBF8F4]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#D76B1A] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[#5A4A42]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute
