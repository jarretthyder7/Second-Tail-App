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
  Users,
  Package,
  Bell,
} from "lucide-react"
import { useOrgBranding } from "@/lib/branding/use-org-branding"
import { InviteFriendsModal } from "@/components/foster/invite-friends-modal"

export default function OrgFosterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const orgId = params.orgId as string
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [showInviteFriendsModal, setShowInviteFriendsModal] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  // Effective state of the reimbursements feature for this foster: org-wide
  // setting, optionally overridden per-foster. Default true while loading so
  // the tab doesn't flicker out for fosters who do have access.
  const [reimbursementsEnabled, setReimbursementsEnabled] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

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

        // Compute effective reimbursements visibility: per-foster override wins
        // over the org default. null/undefined override → inherit org setting.
        try {
          const fosterOverride = profileData?.reimbursements_enabled
          if (fosterOverride === true || fosterOverride === false) {
            setReimbursementsEnabled(fosterOverride)
          } else {
            const { data: settings } = await supabase
              .from("help_request_settings")
              .select("reimbursements_enabled")
              .eq("organization_id", orgId)
              .maybeSingle()
            setReimbursementsEnabled(settings?.reimbursements_enabled !== false)
          }
        } catch {
          // Default-true fallback already in initial state.
        }

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

            // Subscribe to real-time changes on messages table
            const subscription = supabase
              .channel(`messages-${orgId}`)
              .on(
                "postgres_changes",
                {
                  event: "*",
                  schema: "public",
                  table: "messages",
                  filter: `conversation_id=in.(${conversationIds.join(",")})`,
                },
                () => {
                  // Refetch count when messages change
                  ;(async () => {
                    const { count: newCount } = await supabase
                      .from("messages")
                      .select("*", { count: "exact", head: true })
                      .in("conversation_id", conversationIds)
                      .neq("sender_id", user.id)
                      .or(`read_by.is.null,read_by.neq.${user.id}`)

                    setUnreadMessageCount(newCount || 0)
                  })()
                }
              )
              .subscribe()

            return () => {
              subscription.unsubscribe()
            }
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
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false)
      }
    }

    if (showUserMenu || showNotificationDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showUserMenu, showNotificationDropdown])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login/foster"
  }

  const isActive = (path: string) => pathname.includes(path)

  // Once a foster is in an org (which is required to reach this layout), all
  // nav items are available — even before they're matched with an animal.
  const desktopTabs = [
    { name: "Dashboard",      href: `/org/${orgId}/foster/dashboard`,        path: "/dashboard",      icon: LayoutDashboard },
    { name: "Messages",       href: `/org/${orgId}/foster/messages`,          path: "/messages",       icon: MessageSquare   },
    { name: "Appointments",   href: `/org/${orgId}/foster/appointments`,      path: "/appointments",   icon: CalendarIcon    },
    { name: "Learn",          href: `/org/${orgId}/foster/learn`,             path: "/learn",          icon: BookOpen        },
    ...(reimbursementsEnabled
      ? [{ name: "Reimbursements", href: `/org/${orgId}/foster/reimbursements`, path: "/reimbursements", icon: DollarSign }]
      : []),
    { name: "My Requests",    href: `/org/${orgId}/foster/request-supplies`,  path: "/request-supplies", icon: Package       },
  ]

  // Mobile bottom nav
  const bottomTabs = [
    { name: "Home",      href: `/org/${orgId}/foster/dashboard`,       path: "/dashboard",      icon: LayoutDashboard },
    { name: "Messages",  href: `/org/${orgId}/foster/messages`,         path: "/messages",       icon: MessageSquare, badge: unreadMessageCount },
    { name: "Appts",     href: `/org/${orgId}/foster/appointments`,     path: "/appointments",   icon: CalendarIcon    },
    { name: "Requests",  href: `/org/${orgId}/foster/request-supplies`, path: "/request-supplies", icon: Package       },
    { name: "Emergency", href: `/org/${orgId}/foster/emergency`,        path: "/emergency",      icon: AlertCircle,     emergency: true },
  ]

  return (
    <ProtectedRoute allowedRoles={["foster"]}>
      <style>{`
        body { scrollbar-width: none; }
        body::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="min-h-screen text-gray-900" style={{ backgroundColor: "var(--brand-bg, #FBF8F4)" }}>

        {/* ── Header ─────────────────────────────── */}
        <div className="sticky top-0 z-50 bg-white shadow-sm">
          <div className="border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

              {/* Logo */}
              <Link href={`/org/${orgId}/foster/dashboard`} className="flex items-center gap-2">
                {branding?.logo_url ? (
                  <img
                    src={branding.logo_url || "/placeholder.svg"}
                    alt="Organization logo"
                    className="h-8 w-auto"
                    onError={(e) => { e.currentTarget.style.display = "none" }}
                  />
                ) : (
                  <h1 className="text-xl font-bold" style={{ color: "var(--brand-primary, #D76B1A)" }}>
                    Second Tail
                  </h1>
                )}
              </Link>

              <div className="flex items-center gap-2">

                {/* Notification Bell */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                    className="relative p-2 hover:bg-gray-100 rounded-xl transition"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5 text-gray-500" />
                    {unreadMessageCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">
                        {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                      </span>
                    )}
                  </button>

                  {showNotificationDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-lg border border-gray-100 py-3 z-[60]">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                      </div>
                      {unreadMessageCount > 0 ? (
                        <div className="px-3 py-2">
                          <Link
                            href={`/org/${orgId}/foster/messages`}
                            onClick={() => setShowNotificationDropdown(false)}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition"
                          >
                            <MessageSquare className="w-5 h-5 flex-shrink-0" style={{ color: "var(--brand-primary, #D76B1A)" }} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {unreadMessageCount} unread message{unreadMessageCount !== 1 ? "s" : ""}
                              </p>
                              <p className="text-xs text-gray-500">from your rescue team</p>
                            </div>
                          </Link>
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">All caught up!</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Avatar + dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1.5 py-1.5 px-2 rounded-xl hover:bg-gray-100 transition"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: "var(--brand-primary, #D76B1A)" }}>
                      {(profile?.full_name || profile?.name)?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-[60]">
                      <Link
                        href={`/org/${orgId}/foster/journey`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-sm font-medium text-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Heart className="w-4 h-4 text-gray-400" />
                        My Foster Journey
                      </Link>
                      <Link
                        href={`/org/${orgId}/foster/learn`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-sm font-medium text-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        Learn
                      </Link>
                      {/*
                        Reimbursements lives in the desktop top-tab nav, so it's
                        redundant in the dropdown there. Mobile bottom nav
                        doesn't include it, so keep it in the dropdown on mobile
                        only.
                      */}
                      {reimbursementsEnabled && (
                        <Link
                          href={`/org/${orgId}/foster/reimbursements`}
                          className="md:hidden flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-sm font-medium text-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          Reimbursements
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          setShowInviteFriendsModal(true)
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-sm font-medium w-full text-left"
                        style={{ color: "var(--brand-primary, #D76B1A)" }}
                      >
                        <Users className="w-4 h-4" />
                        Invite Friends
                      </button>
                      <div className="h-px bg-gray-100 my-1" />
                      <Link
                        href="/foster/settings"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-sm font-medium text-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4 text-gray-400" />
                        Profile & Settings
                      </Link>
                      <div className="h-px bg-gray-100 my-1" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-sm font-medium text-red-500 w-full text-left"
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

          {/* Desktop tab nav */}
          <nav className="hidden md:block overflow-x-auto border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 flex gap-1">
              {desktopTabs.map((tab) => {
                const Icon = tab.icon
                const showBadge = tab.path === "/messages" && unreadMessageCount > 0
                const baseClass = `py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 relative text-sm`
                const activeClass = isActive(tab.path)
                  ? "border-[var(--brand-primary,#D76B1A)] text-[var(--brand-primary,#D76B1A)] font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-800"
                return (
                  <Link
                    key={tab.path}
                    href={tab.href}
                    className={`${baseClass} ${activeClass}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{tab.name}</span>
                    {showBadge && (
                      <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                        {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>

        {/* Page content */}
        {children}

        {/* ── Mobile Bottom Nav ───────────────────── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
          <div className="flex items-stretch">
            {bottomTabs.map(({ name, href, path, icon: Icon, badge, emergency }: any) => {
              const active = isActive(path)
              return (
                <Link
                  key={path}
                  href={href}
                  className={`flex flex-col items-center justify-center gap-1 py-3 flex-1 transition-colors relative ${
                    emergency
                      ? active ? "text-red-600 bg-red-50" : "text-red-400 hover:text-red-500"
                      : active ? "text-[var(--brand-primary,#D76B1A)]" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-[22px] h-[22px] ${emergency ? "stroke-[2]" : ""}`} />
                    {badge > 0 && (
                      <span className="absolute -top-1 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] leading-none font-medium ${active ? "font-semibold" : ""}`}>
                    {name}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>

      </div>

      <InviteFriendsModal
        isOpen={showInviteFriendsModal}
        onClose={() => setShowInviteFriendsModal(false)}
        fosterName={profile?.full_name || profile?.name || ""}
        referralCode=""
      />
    </ProtectedRoute>
  )
}
