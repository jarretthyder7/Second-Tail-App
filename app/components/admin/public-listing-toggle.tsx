"use client"

import { useState } from "react"
import { Globe, Lock } from "lucide-react"

interface PublicListingToggleProps {
  isPublic: boolean
  onChange: (isPublic: boolean) => void
  disabled?: boolean
}

export function PublicListingToggle({
  isPublic,
  onChange,
  disabled = false,
}: PublicListingToggleProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="w-5 h-5 rounded cursor-pointer"
            style={{ accentColor: "#D76B1A" }}
          />
          <div>
            <p className="font-semibold text-gray-900">List as available for fostering</p>
            <p className="text-sm text-gray-600">
              Shows this animal publicly to fosters looking for a rescue. Only the
              animal&apos;s name and breed are shared — no medical records or
              sensitive data.
            </p>
          </div>
        </label>
      </div>

      {/* Visual indicator */}
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium"
        style={{
          backgroundColor: isPublic ? "rgba(215, 107, 26, 0.1)" : "rgba(107, 114, 128, 0.1)",
          color: isPublic ? "#D76B1A" : "#6B7280",
        }}
      >
        {isPublic ? (
          <>
            <Globe className="w-4 h-4" />
            <span>Publicly visible to foster parents</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Only visible within your organization</span>
          </>
        )}
      </div>
    </div>
  )
}
