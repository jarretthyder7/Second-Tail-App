"use client"

import Link from "next/link"
import { MessageSquare } from "lucide-react"

interface MessagesTabProps {
  orgId: string
}

export function MessagesTab({ orgId }: MessagesTabProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
      <MessageSquare className="w-12 h-12 text-[#D76B1A] mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-[#5A4A42] mb-2">Messages</h3>
      <p className="text-[#2E2E2E]/60 mb-4">Messages are available in the Messages section</p>
      <Link
        href={`/org/${orgId}/foster/messages`}
        className="inline-flex items-center gap-2 rounded-xl bg-[#D76B1A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition"
      >
        Go to Messages
      </Link>
    </div>
  )
}
