"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { applyOrgBranding, cacheBranding, getCachedBranding, type OrgBranding } from "./branding-loader"

export function useOrgBranding(orgId: string | null) {
  const [branding, setBranding] = useState<OrgBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBranding = useCallback(async (id: string) => {
    // Check cache first
    const cached = getCachedBranding(id)
    if (cached) {
      console.log("[v0] Using cached branding for org:", id)
      setBranding(cached)
      applyOrgBranding(cached)
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, logo_url, primary_color, accent_color, background_color")
        .eq("id", id)
        .single()

      if (error) {
        console.error("[v0] Error fetching org branding:", error)
        setError(error.message)
        setLoading(false)
        return
      }

      if (data) {
        const orgBranding: OrgBranding = {
          logo_url: data.logo_url,
          primary_color: data.primary_color,
          accent_color: data.accent_color,
          background_color: data.background_color,
        }

        // Cache and apply
        cacheBranding(id, orgBranding)
        setBranding(orgBranding)
        applyOrgBranding(orgBranding)

        console.log("[v0] Loaded and cached branding for org:", id)
      }

      setLoading(false)
    } catch (err) {
      console.error("[v0] Exception fetching branding:", err)
      setError("Failed to load branding")
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (orgId) {
      fetchBranding(orgId)
    } else {
      setLoading(false)
    }
  }, [orgId, fetchBranding])

  return { branding, loading, error }
}
