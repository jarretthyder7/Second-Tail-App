"use client"

import { AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

type StatusBadgeProps = {
  completionPercentage: number
  missingCount: number
  orgId: string
}

export function SetupStatusBadge({ completionPercentage, missingCount, orgId }: StatusBadgeProps) {
  if (completionPercentage === 100) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-green-900">Setup Complete</p>
          <p className="text-xs text-green-700">You're all set to manage your rescue</p>
        </div>
      </div>
    )
  }

  return (
    <Link href={`/org/${orgId}/admin/setup-wizard`}>
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition cursor-pointer">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">Setup In Progress</p>
          <p className="text-xs text-amber-700">
            {missingCount} step{missingCount !== 1 ? "s" : ""} remaining
          </p>
        </div>
        <div className="flex-shrink-0">
          <div className="text-right">
            <p className="text-sm font-bold text-amber-900">{completionPercentage}%</p>
            <div className="w-12 h-1.5 bg-amber-200 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-amber-600 transition-all" style={{ width: `${completionPercentage}%` }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
