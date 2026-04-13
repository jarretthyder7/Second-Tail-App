"use client"

export type OrgBranding = {
  logo_url?: string
  primary_color?: string
  accent_color?: string
  background_color?: string
  updated_at?: string
}

/**
 * Apply organization branding to the DOM via CSS variables
 * Prevents UI flashing by applying variables before render
 */
export function applyOrgBranding(branding: OrgBranding) {
  if (!branding) return

  const root = document.documentElement

  // Apply CSS variables for dynamic branding
  // Fallback to Second Tail brand colors if not provided
  if (branding.primary_color) {
    root.style.setProperty("--brand-primary", branding.primary_color)
  } else {
    root.style.setProperty("--brand-primary", "#d76b1a")
  }

  if (branding.accent_color) {
    root.style.setProperty("--brand-accent", branding.accent_color)
  } else {
    root.style.setProperty("--brand-accent", "#f7e2bd")
  }

  if (branding.background_color) {
    root.style.setProperty("--brand-bg", branding.background_color)
  } else {
    root.style.setProperty("--brand-bg", "#fbf8f4")
  }

  if (branding.logo_url) {
    root.style.setProperty("--brand-logo-url", `url('${branding.logo_url}')`)
  }

  console.log("Branding applied:", {
    primary: branding.primary_color,
    accent: branding.accent_color,
  })
}

/**
 * Cache branding data in memory to avoid refetching
 */
let brandingCache: { [key: string]: OrgBranding } = {}

export function cacheBranding(orgId: string, branding: OrgBranding) {
  brandingCache[orgId] = branding
}

export function getCachedBranding(orgId: string): OrgBranding | null {
  return brandingCache[orgId] || null
}

export function clearBrandingCache(orgId?: string) {
  if (orgId) {
    delete brandingCache[orgId]
  } else {
    brandingCache = {}
  }
}
