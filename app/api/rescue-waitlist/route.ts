import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Public endpoint: anyone can POST here to join the rescue waitlist.
 * Uses anon-key client; RLS policy on rescue_waitlist allows inserts only.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const orgName = String(body.orgName || '').trim()
    const contactName = String(body.contactName || '').trim()
    const email = String(body.email || '').trim().toLowerCase()

    if (!orgName || !contactName || !email) {
      return NextResponse.json(
        { error: 'Organization name, your name, and email are required.' },
        { status: 400 }
      )
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )

    const { error } = await supabase.from('rescue_waitlist').insert({
      org_name: orgName,
      contact_name: contactName,
      email,
      phone: body.phone ? String(body.phone).trim() : null,
      city: body.city ? String(body.city).trim() : null,
      state: body.state ? String(body.state).trim() : null,
      website: body.website ? String(body.website).trim() : null,
      how_heard: body.howHeard ? String(body.howHeard).trim() : null,
      notes: body.notes ? String(body.notes).trim().slice(0, 2000) : null,
    })

    if (error) {
      console.error('Waitlist insert error:', error)
      return NextResponse.json(
        {
          error:
            'We could not save your submission. Please try again or email us directly.',
        },
        { status: 500 }
      )
    }

    // Best-effort notification to the team (fire-and-forget — don't block the user
    // if the notify email fails).
    try {
      const origin =
        request.headers.get('origin') ||
        `https://${request.headers.get('host') || 'getsecondtail.com'}`
      await fetch(`${origin}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rescue-waitlist-notify',
          orgName,
          contactName,
          email,
          city: body.city || '',
          state: body.state || '',
        }),
      }).catch(() => null)
    } catch {}

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
