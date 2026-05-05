// Client-only Web Push helpers shared by:
//   - components/foster/push-subscription-prompt.tsx (the auto-prompt card)
//   - components/foster/push-notification-toggle.tsx (the settings toggle)
//
// Server code does not import from here; it goes through lib/notify/push.ts.

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

const DISMISS_PREFIX = "secondtail.push.dismissedAt"
const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export type DismissalMode = "push" | "install"

// Status of push capability on this device. Drives both the auto-prompt
// (which mode to show) and the settings toggle (whether it's enabled, and
// what helper text to show).
export type Capability =
  | { kind: "unsupported"; reason: "ios-too-old" | "no-service-worker" | "no-push-manager" | "no-notification" | "no-vapid-key" }
  | { kind: "needs-install" } // iOS 16.4+ in Safari, not added to home screen
  | { kind: "denied" }        // browser permission was explicitly denied
  | { kind: "default" }       // supported, never asked (or cleared)
  | { kind: "granted" }       // permission already granted

export function detectCapability(): Capability {
  if (typeof window === "undefined") return { kind: "unsupported", reason: "no-service-worker" }

  const ios = isIOS()
  const standalone = isStandalone()

  // iOS branch: Apple only allows Web Push in installed PWAs, on 16.4+.
  // Decide before the generic capability check because PushManager *does*
  // exist in iOS 16.4+ Safari — but subscribe() will fail unless installed.
  if (ios && !standalone) {
    if (supportsIOSPush()) return { kind: "needs-install" }
    return { kind: "unsupported", reason: "ios-too-old" }
  }

  if (!VAPID_PUBLIC_KEY) return { kind: "unsupported", reason: "no-vapid-key" }
  if (!("serviceWorker" in navigator)) return { kind: "unsupported", reason: "no-service-worker" }
  if (!("PushManager" in window)) return { kind: "unsupported", reason: "no-push-manager" }
  if (!("Notification" in window)) return { kind: "unsupported", reason: "no-notification" }

  if (Notification.permission === "denied") return { kind: "denied" }
  if (Notification.permission === "granted") return { kind: "granted" }
  return { kind: "default" }
}

// Idempotent — calling repeatedly returns the same registration object.
export async function ensureRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null
  try {
    return await navigator.serviceWorker.register("/sw.js")
  } catch (err) {
    console.warn("[push] SW registration failed:", err)
    return null
  }
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  const reg = await ensureRegistration()
  if (!reg) return null
  return reg.pushManager.getSubscription().catch(() => null)
}

export type EnableResult =
  | { ok: true }
  | { ok: false; reason: "permission-denied" | "permission-default" | "subscribe-failed" | "unsupported" }

// Subscribe and persist to the backend. Must be invoked from a user gesture
// on browsers that gate Notification.requestPermission.
export async function enablePush(): Promise<EnableResult> {
  const cap = detectCapability()
  if (cap.kind === "unsupported" || cap.kind === "needs-install") return { ok: false, reason: "unsupported" }
  if (cap.kind === "denied") return { ok: false, reason: "permission-denied" }

  const reg = await ensureRegistration()
  if (!reg) return { ok: false, reason: "unsupported" }

  // requestPermission must run synchronously inside the user gesture on some
  // browsers — keep it before any awaits that could break that chain.
  let perm: NotificationPermission = Notification.permission
  if (perm !== "granted") {
    perm = await Notification.requestPermission()
  }

  if (perm === "denied") return { ok: false, reason: "permission-denied" }
  if (perm !== "granted") return { ok: false, reason: "permission-default" }

  try {
    const existing = await reg.pushManager.getSubscription().catch(() => null)
    const sub =
      existing ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }))
    await postSubscription(sub)
    // Clear dismissals so the prompt doesn't reappear later if the user
    // clears site data and ends up unsubscribed again.
    clearDismissal("push")
    clearDismissal("install")
    return { ok: true }
  } catch (err) {
    console.warn("[push] subscribe failed:", err)
    return { ok: false, reason: "subscribe-failed" }
  }
}

// Unsubscribe locally and tell the backend to forget this endpoint. Sets a
// fresh dismissal so the auto-prompt won't immediately re-pester them.
export async function disablePush(): Promise<void> {
  const sub = await getExistingSubscription()
  if (sub) {
    const endpoint = sub.endpoint
    try {
      await sub.unsubscribe()
    } catch (err) {
      console.warn("[push] unsubscribe failed:", err)
    }
    try {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      })
    } catch (err) {
      console.warn("[push] unsubscribe POST failed:", err)
    }
  }
  rememberDismissal("push")
}

// Re-sync the existing subscription to the backend. Useful when permission
// is granted but the DB might have lost the row (e.g. the user cleared
// cookies on another visit, but the browser still has the subscription).
export async function syncExistingSubscription(): Promise<void> {
  const sub = await getExistingSubscription()
  if (sub) await postSubscription(sub).catch(() => {})
}

async function postSubscription(sub: PushSubscription) {
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  })
}

// ── Dismissal tracking ──────────────────────────────────────────────────────

export function rememberDismissal(mode: DismissalMode): void {
  try {
    localStorage.setItem(`${DISMISS_PREFIX}.${mode}`, String(Date.now()))
  } catch {
    // private mode / disabled storage — best-effort
  }
}

export function clearDismissal(mode: DismissalMode): void {
  try {
    localStorage.removeItem(`${DISMISS_PREFIX}.${mode}`)
  } catch {
    // best-effort
  }
}

export function wasRecentlyDismissed(mode: DismissalMode): boolean {
  try {
    const raw = localStorage.getItem(`${DISMISS_PREFIX}.${mode}`)
    if (!raw) return false
    const ts = Number(raw)
    if (!Number.isFinite(ts)) return false
    return Date.now() - ts < DISMISS_WINDOW_MS
  } catch {
    return false
  }
}

// ── Platform detection ──────────────────────────────────────────────────────

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  // iPadOS reports as Mac; check touch points to disambiguate from desktop Safari.
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1)
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true
  return Boolean((window.navigator as any).standalone)
}

export function getIOSMajorMinor(): [number, number] | null {
  if (typeof navigator === "undefined") return null
  const ua = navigator.userAgent
  const iphoneMatch = ua.match(/OS (\d+)_(\d+)/)
  if (iphoneMatch) return [Number(iphoneMatch[1]), Number(iphoneMatch[2])]
  if (ua.includes("Mac") && navigator.maxTouchPoints > 1) {
    const safariMatch = ua.match(/Version\/(\d+)\.(\d+)/)
    if (safariMatch) return [Number(safariMatch[1]), Number(safariMatch[2])]
  }
  return null
}

// Apple shipped Web Push for installed PWAs in iOS/iPadOS 16.4.
export function supportsIOSPush(): boolean {
  const v = getIOSMajorMinor()
  if (!v) return false
  const [major, minor] = v
  return major > 16 || (major === 16 && minor >= 4)
}

// ── Misc ────────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i)
  return out
}
