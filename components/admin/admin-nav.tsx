"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function AdminNav() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <nav className="bg-white border-b border-[color:var(--color-border-soft)]">
      <div className="max-w-7xl mx-auto px-4 flex gap-1 md:gap-6">
        <Link
          href="/admin/dashboard"
          className={`py-3 px-2 md:px-3 border-b-2 transition-colors text-sm md:text-base ${
            isActive("/admin/dashboard") && pathname === "/admin/dashboard"
              ? "border-primary-bark text-primary-bark font-semibold"
              : "border-transparent text-text-muted hover:text-text-main"
          }`}
        >
          Dashboard
        </Link>
        <Link
          href="/admin/dogs"
          className={`py-3 px-2 md:px-3 border-b-2 transition-colors text-sm md:text-base ${
            isActive("/admin/dogs")
              ? "border-primary-bark text-primary-bark font-semibold"
              : "border-transparent text-text-muted hover:text-text-main"
          }`}
        >
          Dogs
        </Link>
        <Link
          href="/admin/messages"
          className={`py-3 px-2 md:px-3 border-b-2 transition-colors text-sm md:text-base ${
            isActive("/admin/messages")
              ? "border-primary-bark text-primary-bark font-semibold"
              : "border-transparent text-text-muted hover:text-text-main"
          }`}
        >
          Messages
        </Link>
        <Link
          href="/admin/team-chat"
          className={`py-3 px-2 md:px-3 border-b-2 transition-colors text-sm md:text-base ${
            isActive("/admin/team-chat")
              ? "border-primary-bark text-primary-bark font-semibold"
              : "border-transparent text-text-muted hover:text-text-main"
          }`}
        >
          Team Chat
        </Link>
        <Link
          href="/admin/help-requests"
          className={`py-3 px-2 md:px-3 border-b-2 transition-colors text-sm md:text-base ${
            isActive("/admin/help-requests")
              ? "border-primary-bark text-primary-bark font-semibold"
              : "border-transparent text-text-muted hover:text-text-main"
          }`}
        >
          Help Requests
        </Link>
        <Link
          href="/admin/teams"
          className={`py-3 px-2 md:px-3 border-b-2 transition-colors text-sm md:text-base ${
            isActive("/admin/teams")
              ? "border-primary-bark text-primary-bark font-semibold"
              : "border-transparent text-text-muted hover:text-text-main"
          }`}
        >
          Teams
        </Link>
      </div>
    </nav>
  )
}
