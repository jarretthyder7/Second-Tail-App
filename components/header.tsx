"use client"

import { useRouter, useParams } from "next/navigation"
import { getCurrentUser, logoutUser } from "@/lib/auth"
import { useState } from "react"
import { getTotalUnreadCountForFoster } from "@/lib/mock-data"
import Link from "next/link"

export function Header() {
  const user = getCurrentUser()
  const router = useRouter()
  const params = useParams()
  const orgId = params?.orgId as string | undefined
  const [showMenu, setShowMenu] = useState(false)

  const unreadCount = user?.role === "foster" && user?.id ? getTotalUnreadCountForFoster(user.id, orgId) : 0

  const dashboardUrl =
    user && orgId ? (user.role === "foster" ? `/org/${orgId}/foster/dashboard` : `/org/${orgId}/admin/dashboard`) : "/"

  const handleLogout = () => {
    logoutUser()
    router.push("/login")
  }

  const handleSwitchOrgs = () => {
    router.push("/foster/select-organization")
    setShowMenu(false)
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href={dashboardUrl} className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-[#5A4A42] hover:text-[#D76B1A] transition-colors cursor-pointer">
            Second Tail
          </h1>
        </Link>

        <div className="flex items-center gap-3">
          {user?.role === "foster" && orgId && (
            <Link
              href={`/org/${orgId}/foster/messages`}
              className="relative p-2 hover:bg-[#FBF8F4] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-[#5A4A42]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D76B1A] text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          <div className="hidden sm:block text-right text-sm">
            <p className="font-semibold text-[#5A4A42]">{user?.name}</p>
            <p className="text-[#2E2E2E]/60 capitalize text-xs">{user?.role}</p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-full bg-[#D76B1A] flex items-center justify-center hover:bg-[#D76B1A]/90 transition-colors"
            >
              <span className="text-white font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#F7E2BD]/20 py-1">
                {user?.role === "foster" && (
                  <button
                    onClick={handleSwitchOrgs}
                    className="block w-full text-left px-4 py-2 text-sm text-[#5A4A42] hover:bg-[#FBF8F4] transition-colors"
                  >
                    Switch Organizations
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-[#D97A68] hover:bg-[#FBF8F4] transition-colors"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
