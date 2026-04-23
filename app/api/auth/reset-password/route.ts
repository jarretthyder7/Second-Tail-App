import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendPasswordResetEmail } from '@/lib/email/send'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const origin = request.headers.get('origin') || 'https://getsecondtail.com'

    // Send the user DIRECTLY to /reset-password — the old route went through
    // /auth/callback?next=/reset-password, which sometimes lost the token
    // (strict Supabase redirect allowlist, email clients mangling the query
    // string, etc.) and produced the "no auth code received" error.
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${origin}/reset-password`,
      },
    })

    if (error) {
      // Don't reveal whether the user exists.
      return NextResponse.json({
        success: true,
        message:
          'If an account exists with this email, a reset link has been sent.',
      })
    }

    const resetUrl = data?.properties?.action_link
    if (!resetUrl) {
      return NextResponse.json({
        success: true,
        message:
          'If an account exists with this email, a reset link has been sent.',
      })
    }

    const { success, error: emailError } = await sendPasswordResetEmail(
      email,
      resetUrl
    )

    if (!success) {
      console.error('Reset password email send failed:', emailError)
      return NextResponse.json(
        { error: 'Failed to send password reset email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Password reset email sent' })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
