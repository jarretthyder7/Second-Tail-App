"use client"

// Settings-page toggle for Web Push notifications. Renders a single row
// matching the existing email-prefs styling, plus contextual helper text
// when push isn't currently usable (iOS not installed, browser blocked it,
// device too old, etc.).
//
// All push plumbing comes from lib/push/client.ts so this component and the
// auto-prompt stay in sync.
import { useEffect, useState, type ReactNode } from "react"
import {
  type Capability,
  detectCapability,
  disablePush,
  enablePush,
  ensureRegistration,
  getExistingSubscription,
} from "@/lib/push/client"

type State =
  | { phase: "loading" }
  | { phase: "ready"; capability: Capability; subscribed: boolean }

export function PushNotificationToggle() {
  const [state, setState] = useState<State>({ phase: "loading" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const capability = detectCapability()
      let subscribed = false
      if (capability.kind === "default" || capability.kind === "granted") {
        await ensureRegistration()
        subscribed = Boolean(await getExistingSubscription())
      }
      if (!cancelled) setState({ phase: "ready", capability, subscribed })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (state.phase === "loading") {
    return <Row label="Push notifications" helper="Checking…" disabled checked={false} onToggle={() => {}} />
  }

  const { capability, subscribed } = state

  // Non-actionable states first — toggle is disabled, helper explains why.
  if (capability.kind === "unsupported") {
    const helper =
      capability.reason === "ios-too-old"
        ? "Push notifications need iOS 16.4 or newer. We'll keep emailing you."
        : "Push notifications aren't supported on this browser. We'll keep emailing you."
    return <Row label="Push notifications" helper={helper} disabled checked={false} onToggle={() => {}} />
  }

  if (capability.kind === "needs-install") {
    return (
      <Row
        label="Push notifications"
        helper={
          <>
            On iPhone, add Second Tail to your Home Screen first: tap <strong>Share</strong> →{" "}
            <strong>Add to Home Screen</strong>, then open it from your Home Screen.
          </>
        }
        disabled
        checked={false}
        onToggle={() => {}}
      />
    )
  }

  if (capability.kind === "denied") {
    return (
      <Row
        label="Push notifications"
        helper="Notifications are blocked in your browser. Enable them in your browser settings, then come back to turn this on."
        disabled
        checked={false}
        onToggle={() => {}}
      />
    )
  }

  // capability is "default" or "granted" — toggle is interactive.
  const handleToggle = async (next: boolean) => {
    setBusy(true)
    setError(null)
    if (next) {
      const result = await enablePush()
      setBusy(false)
      if (result.ok) {
        setState({ phase: "ready", capability: { kind: "granted" }, subscribed: true })
        return
      }
      if (result.reason === "permission-denied") {
        setState({ phase: "ready", capability: { kind: "denied" }, subscribed: false })
        return
      }
      if (result.reason === "permission-default") {
        // User dismissed the native prompt without choosing — leave toggle off.
        return
      }
      setError("Couldn't turn on notifications. Please try again.")
      return
    }

    await disablePush()
    setBusy(false)
    setState({ phase: "ready", capability, subscribed: false })
  }

  return (
    <div className="space-y-2">
      <Row
        label="Push notifications"
        helper={
          subscribed
            ? "You'll get a push when your rescue messages you or updates your foster dog's profile."
            : "Get an instant push notification — no email needed."
        }
        checked={subscribed}
        disabled={busy}
        onToggle={handleToggle}
        error={error}
      />
      {subscribed && <TestPushButton />}
    </div>
  )
}

// Diagnostic: fires a push directly to the authed user, bypassing the
// message pipeline. If this works but a real message doesn't, the bug is in
// /api/notify or upstream. If this doesn't work, the bug is in
// subscribe / web-push / SW.
function TestPushButton() {
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleTest = async () => {
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch("/api/push/test", { method: "POST" })
      const data = await res.json()
      if (data.ok) {
        setFeedback(
          `Sent to ${data.subscriptionCount} device${data.subscriptionCount === 1 ? "" : "s"}. Close this tab to see the banner — banners often don't show while the page is in the foreground.`,
        )
      } else if (data.stage === "no-subscriptions") {
        setFeedback("No subscription saved. Toggle push off and back on, then try again.")
      } else {
        setFeedback(`Failed at "${data.stage}": ${data.error || data.message || "unknown"}`)
      }
    } catch (err: any) {
      setFeedback(`Network error: ${err?.message || err}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-1">
      <button
        onClick={handleTest}
        disabled={busy}
        className="text-xs text-[#D76B1A] font-medium hover:underline disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send test push"}
      </button>
      {feedback && <p className="text-xs text-[#2E2E2E]/70 mt-1">{feedback}</p>}
    </div>
  )
}

function Row({
  label,
  helper,
  checked,
  disabled,
  onToggle,
  error,
}: {
  label: string
  helper: ReactNode
  checked: boolean
  disabled?: boolean
  onToggle: (next: boolean) => void
  error?: string | null
}) {
  return (
    <label
      className={`flex items-center justify-between p-4 rounded-xl border-2 border-[#F7E2BD] transition ${
        disabled ? "opacity-70 cursor-not-allowed" : "hover:bg-[#FBF8F4] cursor-pointer"
      }`}
    >
      <div className="pr-3">
        <div className="font-medium text-[#5A4A42]">{label}</div>
        <div className="text-xs text-[#2E2E2E]/70 mt-0.5">{helper}</div>
        {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onToggle(e.target.checked)}
        className="w-5 h-5 rounded border-[#F7E2BD] text-[#D76B1A] focus:ring-[#D76B1A]/40 flex-shrink-0"
      />
    </label>
  )
}
