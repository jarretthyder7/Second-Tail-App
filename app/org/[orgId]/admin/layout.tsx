"use client"

import type React from "react"
import { OnboardingTutorial } from "@/components/admin/onboarding-tutorial"
import { FirstTimeSetupModal } from "@/components/admin/first-time-setup-modal"
import { SetupSidebarWidget } from "@/components/admin/setup-sidebar-widget"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChevronUp, LogOut, Upload } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams, usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Dog,
  Users,
  MessageSquare,
  HelpCircle,
  UsersRound,
  Settings,
  Building2,
  Menu,
  X,
  DollarSign,
  CalendarIcon,
  Mail,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Profile = {
  id: string
  email: string
  name: string
  role: string
  org_role: string | null
  organization_id: string | null
}

type Organization = {
  id: string
  name: string
  email: string
  phone: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
}

export default function OrgAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const orgId = params.orgId as string
  const [org, setOrg] = useState<Organization | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [setupStatus, setSetupStatus] = useState<string[]>([])
  const userName = profile?.name

  const isOrgAdmin = profile?.org_role === "org_admin"

  useEffect(() => {
    async function loadUserProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login/rescue")
        return
      }

      const { data: profileData, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) {
        console.error("[v0] Error loading profile:", error)
        setLoading(false)
        return
      }

      setProfile(profileData)
      setLoading(false)
    }

    loadUserProfile()
  }, [router])

  useEffect(() => {
    async function loadOrg() {
      const supabase = createClient()
      const { data, error } = await supabase.from("organizations").select("*").eq("id", orgId).maybeSingle()

      if (error) {
        console.error("[v0] Error loading organization:", error.message)
        return
      }

      if (!data) {
        console.warn("[v0] Organization not found or access denied:", orgId)
        return
      }

      setOrg(data)
    }

    if (orgId) {
      loadOrg()
    }

    const handleOrgUpdate = (event: any) => {
      if (event.detail?.orgId === orgId) {
        loadOrg()
      }
    }

    window.addEventListener("organization-updated", handleOrgUpdate)

    return () => {
      window.removeEventListener("organization-updated", handleOrgUpdate)
    }
  }, [orgId])

  useEffect(() => {
    async function loadSetupStatus() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("organization_setup_status")
        .select("setup_step_id")
        .eq("organization_id", orgId)
        .eq("is_completed", true)

      if (!error && data) {
        setSetupStatus(data.map((d: any) => d.setup_step_id))
      }
    }

    if (orgId) {
      loadSetupStatus()
    }
  }, [orgId])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login/rescue")
  }

  const navItems = [
    // Foster-facing tools
    {
      href: `/org/${orgId}/admin/dashboard`,
      label: "Dashboard",
      icon: LayoutDashboard,
      adminOnly: false,
      section: "main",
    },
    { href: `/org/${orgId}/admin/animals`, label: "Animals", icon: Dog, adminOnly: false, section: "main" },
    { href: `/org/${orgId}/admin/fosters`, label: "Fosters", icon: Users, adminOnly: false, section: "main" },
    {
      href: `/org/${orgId}/admin/messages`,
      label: "Foster Messages",
      icon: MessageSquare,
      adminOnly: false,
      section: "foster",
      description: "Message foster parents about their animals",
    },
    {
      href: `/org/${orgId}/admin/help-requests`,
      label: "Support Requests",
      icon: HelpCircle,
      adminOnly: false,
      section: "foster",
    },
    {
      href: `/org/${orgId}/admin/reimbursements`,
      label: "Reimbursements",
      icon: DollarSign,
      adminOnly: false,
      section: "foster",
    },
    {
      href: `/org/${orgId}/admin/appointments`,
      label: "Appointments",
      icon: CalendarIcon,
      adminOnly: false,
      section: "foster",
    },
    {
      href: `/org/${orgId}/admin/communications`,
      label: "Communications",
      icon: Mail,
      adminOnly: false,
      section: "foster",
    },
    // Staff-only tools (divider before)
    {
      href: `/org/${orgId}/admin/teams`,
      label: "Staff Teams",
      icon: UsersRound,
      adminOnly: false,
      section: "staff",
      description: "Manage rescue staff and team assignments",
    },
    {
      href: `/org/${orgId}/admin/team-chat`,
      label: "Staff Chat",
      icon: MessageSquare,
      adminOnly: false,
      section: "staff",
      staffOnly: true,
      description: "Internal chat for rescue staff only",
    },
    // Admin tools
    { href: `/org/${orgId}/admin/import`, label: "Import Data", icon: Upload, adminOnly: true, section: "admin" },
  ]

  const handleNavClick = (href: string, adminOnly: boolean) => {
    if (adminOnly && !isOrgAdmin) {
      alert("You need admin permissions to do that.")
      router.push(`/org/${orgId}/admin/dashboard`)
      setMobileMenuOpen(false)
      return
    }
    setMobileMenuOpen(false)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FBF8F4]">
        <div className="text-[#5A4A42]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#FBF8F4] overflow-hidden">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#F7E2BD] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D76B1A] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#5A4A42]">{org?.name || "Loading..."}</h2>
            <p className="text-xs text-[#2E2E2E]/60">{isOrgAdmin ? "Admin" : "Staff"}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-[#FBF8F4] rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-[#5A4A42]" /> : <Menu className="w-6 h-6 text-[#5A4A42]" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed md:relative z-40
        w-64 bg-white border-r border-[#F7E2BD] flex-shrink-0
        transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        h-screen
      `}
      >
        <div className="flex flex-col w-full h-full">
          {/* Org Header */}
          <div className="p-6 border-b border-[#F7E2BD] flex-shrink-0 mt-16 md:mt-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D76B1A] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#5A4A42]">{org?.name || "Loading..."}</h2>
                <p className="text-xs text-[#2E2E2E]/60">{isOrgAdmin ? "Admin Portal" : "Staff Portal"}</p>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
            {/* Main section */}
            {navItems
              .filter((item) => item.section === "main")
              .map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                const isDisabled = item.adminOnly && !isOrgAdmin

                return (
                  <Link
                    key={item.href}
                    href={isDisabled ? "#" : item.href}
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault()
                        handleNavClick(item.href, item.adminOnly)
                      } else {
                        setMobileMenuOpen(false)
                      }
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition relative ${
                      isDisabled
                        ? "text-[#5A4A42]/40 cursor-not-allowed hover:bg-[#FBF8F4]/50"
                        : isActive
                          ? "bg-[#D76B1A] text-white"
                          : "text-[#5A4A42] hover:bg-[#FBF8F4]"
                    }`}
                    title={item.description || (isDisabled ? "Admin only" : "")}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {isDisabled && <span className="ml-auto text-xs text-[#5A4A42]/30">🔒</span>}
                  </Link>
                )
              })}

            {/* Foster-facing section */}
            <div className="pt-2 pb-1">
              <p className="px-3 text-xs font-medium text-[#5A4A42]/50 uppercase tracking-wider">Foster Tools</p>
            </div>
            {navItems
              .filter((item) => item.section === "foster")
              .map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                const isDisabled = item.adminOnly && !isOrgAdmin

                return (
                  <Link
                    key={item.href}
                    href={isDisabled ? "#" : item.href}
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault()
                        handleNavClick(item.href, item.adminOnly)
                      } else {
                        setMobileMenuOpen(false)
                      }
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition relative ${
                      isDisabled
                        ? "text-[#5A4A42]/40 cursor-not-allowed hover:bg-[#FBF8F4]/50"
                        : isActive
                          ? "bg-[#D76B1A] text-white"
                          : "text-[#5A4A42] hover:bg-[#FBF8F4]"
                    }`}
                    title={item.description || (isDisabled ? "Admin only" : "")}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {isDisabled && <span className="ml-auto text-xs text-[#5A4A42]/30">🔒</span>}
                  </Link>
                )
              })}

            {/* Staff-only section with divider */}
            <div className="pt-4 pb-1 border-t border-[#F7E2BD] mt-2">
              <div className="flex items-center gap-2 px-3">
                <ChevronUp className="w-3 h-3 text-[#5A4A42]/50" />
                <p className="text-xs font-medium text-[#5A4A42]/50 uppercase tracking-wider">Staff Only</p>
              </div>
            </div>
            {navItems
              .filter((item) => item.section === "staff")
              .map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                const isDisabled = item.adminOnly && !isOrgAdmin

                return (
                  <Link
                    key={item.href}
                    href={isDisabled ? "#" : item.href}
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault()
                        handleNavClick(item.href, item.adminOnly)
                      } else {
                        setMobileMenuOpen(false)
                      }
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition relative ${
                      isDisabled
                        ? "text-[#5A4A42]/40 cursor-not-allowed hover:bg-[#FBF8F4]/50"
                        : isActive
                          ? "bg-[#D76B1A] text-white"
                          : "text-[#5A4A42] hover:bg-[#FBF8F4]"
                    }`}
                    title={item.description || (isDisabled ? "Admin only" : "")}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {item.staffOnly && !isActive && <ChevronUp className="w-3 h-3 ml-auto text-[#5A4A42]/30" />}
                    {isDisabled && <span className="ml-auto text-xs text-[#5A4A42]/30">🔒</span>}
                  </Link>
                )
              })}

            {/* Admin section */}
            <div className="pt-4 pb-1 border-t border-[#F7E2BD] mt-2">
              <p className="px-3 text-xs font-medium text-[#5A4A42]/50 uppercase tracking-wider">Admin</p>
            </div>
            {navItems
              .filter((item) => item.section === "admin")
              .map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                const isDisabled = item.adminOnly && !isOrgAdmin

                return (
                  <Link
                    key={item.href}
                    href={isDisabled ? "#" : item.href}
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault()
                        handleNavClick(item.href, item.adminOnly)
                      } else {
                        setMobileMenuOpen(false)
                      }
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition relative ${
                      isDisabled
                        ? "text-[#5A4A42]/40 cursor-not-allowed hover:bg-[#FBF8F4]/50"
                        : isActive
                          ? "bg-[#D76B1A] text-white"
                          : "text-[#5A4A42] hover:bg-[#FBF8F4]"
                    }`}
                    title={item.description || (isDisabled ? "Admin only" : "")}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {isDisabled && <span className="ml-auto text-xs text-[#5A4A42]/30">🔒</span>}
                  </Link>
                )
              })}
          </nav>

          {/* User footer display with dropdown menu */}
          <div className="mt-auto pt-4 border-t border-[#F7E2BD]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full px-3 py-2 rounded-xl bg-[#FBF8F4] hover:bg-[#F7E2BD] transition cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#D76B1A] text-white flex items-center justify-center text-sm font-semibold">
                      {userName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#5A4A42] truncate">{userName || "User"}</p>
                      <p className="text-xs text-[#5A4A42]/60">
                        {profile?.org_role
                          ? profile.org_role
                              .split("_")
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ")
                          : "Staff"}
                      </p>
                    </div>
                    <ChevronUp className="w-4 h-4 text-[#5A4A42]/60" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mb-2">
                <DropdownMenuItem asChild>
                  <Link href={`/org/${orgId}/admin/settings`} className="flex items-center gap-3 cursor-pointer py-2.5">
                    <Settings className="w-4 h-4 text-[#5A4A42]" />
                    <div>
                      <div className="font-medium text-[#2E2E2E]">Settings</div>
                      <div className="text-xs text-[#5A4A42]/60">Manage organization</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/org/${orgId}/admin/settings?support=true`} className="flex items-center gap-3 cursor-pointer py-2.5">
                    <HelpCircle className="w-4 h-4 text-[#D76B1A]" />
                    <div>
                      <div className="font-medium text-[#2E2E2E]">Support</div>
                      <div className="text-xs text-[#5A4A42]/60">Get help or report issues</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    window.location.href = "/login"
                  }}
                  className="flex items-center gap-3 text-red-600 cursor-pointer py-2.5"
                >
                  <LogOut className="w-4 h-4" />
                  <div>
                    <div className="font-medium">Logout</div>
                    <div className="text-xs text-red-600/60">Sign out of your account</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content with floating setup widget */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <main className="flex-1 overflow-y-auto pt-16 md:pt-0">{children}</main>
        <SetupSidebarWidget orgId={orgId} initialCompletedSteps={setupStatus} />
      </div>

      {/* Onboarding Tutorial Overlay */}
      <OnboardingTutorial />

      {/* First-time setup modal */}
      <FirstTimeSetupModal />
    </div>
  )
}
