"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "./supabase/client"
import { PageLoader } from "@/components/page-loader"

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

      if (userError || !user) {
        router.push("/login")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, organization_id")
        .eq("id", user.id)
        .single()

      if (profileError || !profile) {
        router.push("/login")
        return
      }

      if (allowedRoles && !allowedRoles.includes(profile.role as "foster" | "rescue")) {
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
    return <PageLoader />
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute
