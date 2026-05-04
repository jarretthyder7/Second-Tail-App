"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type WaitlistEntry = {
  id: string
  org_name: string
  contact_name: string
  email: string
  phone: string | null
  city: string | null
  state: string | null
  website: string | null
  how_heard: string | null
  notes: string | null
  status: string
  created_at: string
}

export default function PlatformWaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [statusFilter, setStatusFilter] = useState<"pending" | "accepted" | "all">("pending")
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  useEffect(() => {
    loadEntries()
  }, [statusFilter])

  async function loadEntries() {
    setLoading(true)
    setAuthError(null)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setAuthError("You need to sign in.")
        setLoading(false)
        return
      }

      const res = await fetch(`/api/admin/rescue-waitlist?status=${statusFilter}`)
      if (res.status === 403) {
        setAuthError("This page is restricted to platform admins.")
        setLoading(false)
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setAuthError(body.error || "Failed to load waitlist.")
        setLoading(false)
        return
      }
      const json = await res.json()
      setEntries(json.entries || [])
    } catch (err: any) {
      setAuthError(err?.message || "Failed to load waitlist.")
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(entry: WaitlistEntry) {
    if (!confirm(`Send invite email to ${entry.contact_name} (${entry.email}) for ${entry.org_name}?`)) return
    setActing(entry.id)
    setBanner(null)
    try {
      const res = await fetch(`/api/admin/rescue-waitlist/${entry.id}/accept`, { method: "POST" })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setBanner({ kind: "err", text: body.error || "Failed to send invite" })
        return
      }
      setBanner({
        kind: "ok",
        text: `Invite sent to ${entry.email}. They'll get a Supabase email to set their password.`,
      })
      // Optimistically drop from pending list (or move to accepted if we're on "all").
      setEntries((prev) =>
        statusFilter === "pending"
          ? prev.filter((e) => e.id !== entry.id)
          : prev.map((e) => (e.id === entry.id ? { ...e, status: "accepted" } : e)),
      )
    } catch (err: any) {
      setBanner({ kind: "err", text: err?.message || "Failed to send invite" })
    } finally {
      setActing(null)
    }
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md text-center">
          <h1 className="font-bold text-[#5A4A42] text-lg mb-2">Access denied</h1>
          <p className="text-sm text-[#5A4A42]/70">{authError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBF8F4] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#5A4A42]">Rescue waitlist</h1>
            <p className="text-sm text-[#2E2E2E]/70">Approve rescues and send them a sign-up invite.</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-[#E8DDD1] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]"
          >
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="all">All</option>
          </select>
        </div>

        {banner && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm ${
              banner.kind === "ok"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {banner.text}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-[#2E2E2E]/60">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-[#5A4A42] font-medium">No {statusFilter === "all" ? "" : statusFilter} entries</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-[#5A4A42]">{entry.org_name}</h2>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          entry.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {entry.status}
                      </span>
                      <span className="text-xs text-[#5A4A42]/60">
                        {new Date(entry.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-[#2E2E2E] mt-1">
                      <span className="font-medium">{entry.contact_name}</span> · {entry.email}
                      {entry.phone ? ` · ${entry.phone}` : ""}
                    </p>
                    {(entry.city || entry.state) && (
                      <p className="text-xs text-[#5A4A42]/70 mt-0.5">
                        {[entry.city, entry.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {entry.website && (
                      <a
                        href={entry.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#D76B1A] hover:underline mt-1 inline-block"
                      >
                        {entry.website}
                      </a>
                    )}
                    {entry.how_heard && (
                      <p className="text-xs text-[#5A4A42]/70 mt-2">
                        <span className="font-medium">How they heard:</span> {entry.how_heard}
                      </p>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-[#5A4A42] mt-2 whitespace-pre-wrap border-l-2 border-[#F7E2BD] pl-3">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                  {entry.status !== "accepted" && (
                    <button
                      type="button"
                      onClick={() => handleAccept(entry)}
                      disabled={acting === entry.id}
                      className="bg-[#D76B1A] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#C05A0A] transition disabled:opacity-50 flex-shrink-0"
                    >
                      {acting === entry.id ? "Sending…" : "Approve & invite"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
