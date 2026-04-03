"use client"

import type React from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/lib/protected-route"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Settings,
  LogOut,
  ChevronDown,
  Heart,
  AlertCircle,
  BookOpen,
  CalendarIcon,
  LayoutDashboard,
  MessageSquare,
  DollarSign,
  Menu,
  X,
  Users,
  Package,
} from "lucide-react"
import { useOrgBranding } from "@/lib/branding/use-org-branding"

export default function OrgFosterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const orgId = params.orgId as string
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  const { branding } = useOrgBranding(orgId)

  useEffect(() => {
    const fetchProfileAndUnreadCount = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setProfile(profileData)

        // Fetch foster's dogs to find their conversations
        const { data: dogs } = await supabase
          .from("dogs")
          .select("id")
          .eq("foster_id", user.id)
          .eq("organization_id", orgId)

        if (dogs && dogs.length > 0) {
          const dogIds = dogs.map((d) => d.id)

          // Get conversations for foster's dogs
          const { data: conversations } = await supabase
            .from("conversations")
            .select("id")
            .eq("organization_id", orgId)
            .in("dog_id", dogIds)

          if (conversations && conversations.length > 0) {
            const conversationIds = conversations.map((c) => c.id)

            // Count unread messages (not sent by foster and not read by foster)
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .in("conversation_id", conversationIds)
              .neq("sender_id", user.id)
              .or(`read_by.is.null,read_by.neq.${user.id}`)

            setUnreadMessageCount(count || 0)
          }
        }
      }
    }

    fetchProfileAndUnreadCount()
  }, [orgId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showUserMenu])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login/foster"
  }

  const isActive = (path: string) => pathname.includes(path)

  const tabs = [
    {
      name: "Dashboard",
      href: `/org/${orgId}/foster/dashboard`,
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Messages",
      href: `/org/${orgId}/foster/messages`,
      path: "/messages",
      icon: MessageSquare,
    },
    {
      name: "Appointments",
      href: `/org/${orgId}/foster/appointments`,
      path: "/appointments",
      icon: CalendarIcon,
    },
    {
      name: "Learn",
      href: `/org/${orgId}/foster/learn`,
      path: "/learn",
      icon: BookOpen,
    },
    {
      name: "Reimbursements",
      href: `/org/${orgId}/foster/reimbursements`,
      path: "/reimbursements",
      icon: DollarSign,
    },
    {
      name: "My Requests",
      href: `/org/${orgId}/foster/request-supplies`,
      path: "/request-supplies",
      icon: Package,
    },
  ]

  return (
    <ProtectedRoute allowedRoles={["foster"]}>
      <div className="min-h-screen bg-(--brand-bg,#fbf8f4) text-text-main">
        <div className="sticky top-0 z-50 bg-white shadow-sm">
          {/* Top bar with logo and user menu */}
          <div className="border-b border-[color:var(--color-border-soft)]">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
              <Link href={`/org/${orgId}/foster/dashboard`} className="flex items-center gap-2">
                {branding?.logo_url ? (
                  <img
                    src={branding.logo_url || "/placeholder.svg"}
                    alt="Organization logo"
                    className="h-8 w-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                ) : (
                  <h1 className="text-xl font-bold text-(--brand-primary,#50402b) hover:text-(--brand-accent,#d76b1a) transition-colors cursor-pointer">
                    Second Tail
                  </h1>
                )}
              </Link>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 hover:bg-neutral-cream rounded-lg transition"
                >
                  {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-neutral-cream transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-orange/20 flex items-center justify-center text-sm font-bold text-primary-orange">
                      {profile?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="text-sm font-medium text-primary-bark hidden sm:block">
                      {profile?.name || "User"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-text-muted transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-[color:var(--color-border-soft)] py-2 z-[60]">
                      <Link
                        href={`/org/${orgId}/foster/journey`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-cream transition text-sm font-medium text-primary-bark"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Heart className="w-4 h-4" />
                        My Foster Journey
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          // Dispatch custom event to trigger invite modal in dashboard
                          window.dispatchEvent(new CustomEvent("openInviteModal"))
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-cream transition text-sm font-medium text-primary-orange w-full text-left"
                      >
                        <Users className="w-4 h-4" />
                        Invite Friends
                      </button>
                      <Link
                        href={`/org/${orgId}/foster/emergency`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-cream transition text-sm font-medium text-red-600"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <AlertCircle className="w-4 h-4" />
                        Emergency Help
                      </Link>
                      <div className="border-t border-[color:var(--color-border-soft)] my-2"></div>
                      <Link
                        href="/foster/settings"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-cream transition text-sm font-medium text-primary-bark"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Profile & Settings
                      </Link>
                      <div className="border-t border-[color:var(--color-border-soft)] my-2"></div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-cream transition text-sm font-medium text-red-600 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation tabs */}
          <nav className="hidden md:block overflow-x-auto border-t border-[color:var(--color-border-soft)]">
            <div className="max-w-7xl mx-auto px-4 flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const showBadge = tab.path === "/messages" && unreadMessageCount > 0
                return (
                  <Link
                    key={tab.path}
                    href={tab.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 relative ${
                      isActive(tab.path)
                        ? "border-primary-orange text-primary-orange font-semibold"
                        : "border-transparent text-text-muted hover:text-text-main"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{tab.name}</span>
                    {showBadge && (
                      <span className="absolute -top-0.5 -right-0.5 lg:relative lg:top-auto lg:right-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                        {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          {showMobileMenu && (
            <nav className="md:hidden border-t border-[color:var(--color-border-soft)] bg-white">
              <div className="px-4 py-2 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const showBadge = tab.path === "/messages" && unreadMessageCount > 0
                  return (
                    <Link
                      key={tab.path}
                      href={tab.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                        isActive(tab.path)
                          ? "bg-primary-orange/10 text-primary-orange font-semibold"
                          : "text-text-muted hover:bg-neutral-cream"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.name}</span>
                      {showBadge && (
                        <span className="ml-auto min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold px-1">
                          {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </nav>
          )}
        </div>

        {children}
      </div>
    </ProtectedRoute>
  )
}
