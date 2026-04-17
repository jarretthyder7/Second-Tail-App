"use client"

import { useState } from "react"
import { Users, Copy, Check, X } from "lucide-react"

interface InviteFriendsModalProps {
  isOpen: boolean
  onClose: () => void
  fosterName: string
  referralCode: string
}

export function InviteFriendsModal({ isOpen, onClose, fosterName, referralCode }: InviteFriendsModalProps) {
  const [copied, setCopied] = useState(false)

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/sign-up/foster`
  const shareMessage = `Hi! I'm fostering with Second Tail and it's an amazing way to help rescue animals. If you're interested in fostering, ask your local rescue about Second Tail! 🐾\n\n${referralLink}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(shareMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full space-y-6">
        {/* Header */}
        <div className="border-b border-neutral-clay/20 p-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-orange/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-orange" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-bark">Share Second Tail</h2>
              <p className="text-sm text-text-muted">Tell others about fostering</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-primary-bark transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 space-y-6">
          {/* Share Link */}
          <div className="space-y-3">
            <h3 className="font-semibold text-primary-bark">Share Second Tail</h3>
            <p className="text-sm text-text-muted">
              Tell friends about Second Tail. They can contact their local rescue to get started with fostering.
            </p>
            <div className="bg-neutral-cream rounded-xl p-3 flex items-center gap-2 group hover:bg-neutral-clay/20 transition cursor-pointer">
              <code className="flex-1 text-xs font-mono text-text-main break-all">{referralLink}</code>
              <button
                onClick={handleCopyLink}
                className="flex-shrink-0 text-text-muted hover:text-primary-orange transition p-2"
                title="Copy link"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Share Message */}
          <div className="space-y-3">
            <h3 className="font-semibold text-primary-bark">Share on Social</h3>
            <p className="text-sm text-text-muted">
              Use this message to share with friends on email or messaging apps.
            </p>
            <div className="bg-neutral-cream rounded-xl p-4 space-y-3">
              <p className="text-sm text-text-main whitespace-pre-wrap break-words">{shareMessage}</p>
              <button
                onClick={handleCopyMessage}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-orange/10 text-primary-orange hover:bg-primary-orange/20 transition font-medium text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Message
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-primary-orange/5 border border-primary-orange/20 rounded-xl p-4">
            <p className="text-xs text-text-muted leading-relaxed">
              Second Tail is used by rescue organizations to coordinate with their fosters. Interested friends should
              contact their local rescue organization to see if they use Second Tail.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-clay/20 p-6 pt-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded-lg bg-primary-orange text-white font-semibold hover:bg-primary-orange/90 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
