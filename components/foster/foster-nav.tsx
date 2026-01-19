"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

export function FosterNav({ onInviteClick }: { onInviteClick?: () => void }) {
  const pathname = usePathname()
  const params = useParams()
  const orgId = params.orgId as string
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <nav className="bg-white border-b border-[#F7E2BD]/20">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="flex gap-6">
          <Link
            href={`/org/${orgId}/foster/dashboard`}
            className={`py-3 px-2 border-b-2 transition-colors ${
              isActive(`/org/${orgId}/foster/dashboard`)
                ? "border-[#D76B1A] text-[#D76B1A] font-semibold"
                : "border-transparent text-[#2E2E2E]/60 hover:text-[#2E2E2E]"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href={`/org/${orgId}/foster/messages`}
            className={`py-3 px-2 border-b-2 transition-colors ${
              isActive(`/org/${orgId}/foster/messages`)
                ? "border-[#D76B1A] text-[#D76B1A] font-semibold"
                : "border-transparent text-[#2E2E2E]/60 hover:text-[#2E2E2E]"
            }`}
          >
            Messages
          </Link>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 py-3 px-3 text-[#2E2E2E] hover:bg-gray-100 rounded-lg transition"
          >
            <span className="text-sm font-medium">Menu</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              {/* Menu items can be added here in the future */}
              <div className="px-4 py-3 text-sm text-gray-500">No menu items</div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
