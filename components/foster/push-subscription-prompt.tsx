"use client"

// Foster-side notification auto-prompt. Two modes depending on the device:
//
//   "push"    — normal Web Push permission flow (Android, desktop, or iOS
//               16.4+ when the PWA is installed to the home screen).
//   "install" — iOS 16.4+ in Safari (not installed). Apple requires the PWA
//               be installed to home screen before push can be subscribed,
//               so we coach the user through Add-to-Home-Screen instead of
//               firing a permission prompt that would just fail.
//
// Hidden silently when:
//   - the device doesn't support push (covers iOS < 16.4)
//   - permission is already "denied"
//   - the user dismissed the SAME mode within the last 7 days (per-mode
//     dismissal: dismissing the install card in Safari doesn't suppress
//     the push card after they install)
//   - we already have an active subscription
//
// All push plumbing (capability detection, subscribe, dismissal storage)
// lives in lib/push/client.ts so the settings toggle can share it.
import { useEffect, useState, type ReactNode } from "react"
import { Bell, Share, Plus, X } from "lucide-react"
import {
  detectCapability,
  enablePush,
  ensureRegistration,
  getExistingSubscription,
  rememberDismissal,
  syncExistingSubscription,
  wasRecentlyDismissed,
} from "@/lib/push/client"

export type PushPromptAudience = "foster" | "admin"

type Props = {
  // Used in the prompt copy ("Get notified when {orgName} messages you...").
  // For admin audiences this is shown as the actor name where applicable.
  orgName?: string
  // Tunes copy for the audience. Defaults to foster.
  audience?: PushPromptAudience
}

type Mode = "hidden" | "push" | "install"

const COPY = {
  foster: {
    pushTitle: "Turn on notifications",
    pushBody: (orgName?: string) => (
      <>
        Get notified when {orgName ? <strong>{orgName}</strong> : "your rescue"} messages you or updates your foster dog's profile.
      </>
    ),
    installTitle: "Get notifications on iPhone",
    installBody: (orgName?: string) => (
      <>
        To get notified when {orgName ? <strong>{orgName}</strong> : "your rescue"} messages you,
        add Second Tail to your Home Screen.
      </>
    ),
  },
  admin: {
    pushTitle: "Turn on notifications",
    pushBody: () => (
      <>
        Get notified when fosters message you, request appointments, or submit reimbursements.
      </>
    ),
    installTitle: "Get notifications on iPhone",
    installBody: () => (
      <>
        To get notified about foster activity, add Second Tail to your Home Screen.
      </>
    ),
  },
} as const

export function PushSubscriptionPrompt({ orgName, audience = "foster" }: Props) {
  const [mode, setMode] = useState<Mode>("hidden")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function decide() {
      const cap = detectCapability()

      if (cap.kind === "needs-install") {
        if (wasRecentlyDismissed("install")) return
        if (!cancelled) setMode("install")
        return
      }

      if (cap.kind !== "default" && cap.kind !== "granted") return

      if (wasRecentlyDismissed("push")) return

      // Pre-register the SW so we can read the existing subscription state.
      await ensureRegistration()
      const existing = await getExistingSubscription()

      if (cap.kind === "granted") {
        // User already accepted; if the DB lost the row (cleared cookies,
        // re-deployed, etc.) silently re-sync. Either way no prompt is shown.
        if (!existing) {
          await enablePush().catch(() => {})
        } else {
          await syncExistingSubscription().catch(() => {})
        }
        return
      }

      if (existing) return // already subscribed; nothing to do
      if (!cancelled) setMode("push")
    }

    decide()
    return () => {
      cancelled = true
    }
  }, [])

  if (mode === "hidden") return null

  const copy = COPY[audience]

  if (mode === "install") {
    return (
      <InstallPrompt
        title={copy.installTitle}
        body={copy.installBody(orgName)}
        onDismiss={() => {
          rememberDismissal("install")
          setMode("hidden")
        }}
      />
    )
  }

  const handleEnable = async () => {
    setBusy(true)
    setError(null)
    const result = await enablePush()
    setBusy(false)

    if (result.ok) {
      setMode("hidden")
      return
    }

    if (result.reason === "permission-denied") {
      // No path back without browser-settings work — hide for now.
      setMode("hidden")
      return
    }

    if (result.reason === "permission-default") {
      // User dismissed the native prompt; treat as "not now" so we don't
      // immediately ask again.
      rememberDismissal("push")
      setMode("hidden")
      return
    }

    setError("Couldn't turn on notifications. You can try again from settings.")
  }

  const handleDismiss = () => {
    rememberDismissal("push")
    setMode("hidden")
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-6 md:max-w-sm z-[70]">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--brand-primary, #D76B1A)" }}
          >
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">{copy.pushTitle}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {copy.pushBody(orgName)}
            </p>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                disabled={busy}
                className="flex-1 px-3 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: "var(--brand-primary, #D76B1A)" }}
              >
                {busy ? "Enabling…" : "Enable"}
              </button>
              <button
                onClick={handleDismiss}
                disabled={busy}
                className="px-3 py-2 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            disabled={busy}
            className="text-gray-300 hover:text-gray-500 disabled:opacity-60"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Shown to iOS Safari users on 16.4+ who haven't installed the PWA. The
// only way to get push working on iOS is via the home-screen-installed PWA,
// so we coach them through it instead of asking for a permission they can't
// grant. Once installed, the PWA opens standalone and the normal push flow
// takes over.
function InstallPrompt({ title, body, onDismiss }: { title: string; body: ReactNode; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-6 md:max-w-sm z-[70]">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--brand-primary, #D76B1A)" }}
          >
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {body}
            </p>
            <ol className="mt-3 space-y-2 text-xs text-gray-700">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
                <span>
                  Tap the <Share className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" aria-label="Share" /> Share button at the bottom of Safari
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
                <span>
                  Scroll and tap <strong>Add to Home Screen</strong> <Plus className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" aria-hidden="true" />
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold mt-0.5">3</span>
                <span>
                  Tap <strong>Add</strong>, then open Second Tail from your Home Screen
                </span>
              </li>
            </ol>
            <div className="flex gap-2 mt-3">
              <button
                onClick={onDismiss}
                className="px-3 py-2 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-300 hover:text-gray-500"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
