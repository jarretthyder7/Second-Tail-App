import type { SupabaseClient } from '@supabase/supabase-js'

const QUIET_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

/**
 * Decide whether to send an email notification for a new message.
 *
 * Rule: skip the email if the recipient has marked any message in this
 * conversation as read within the last 10 minutes. That means they're
 * actively engaged — an email ping would be noise.
 *
 * Fails open (returns true) on any error, so a buggy check never
 * accidentally silences notifications.
 */
export async function shouldSendEmailNotification(
  supabase: SupabaseClient,
  conversationId: string,
  recipientUserId: string
): Promise<boolean> {
  try {
    const cutoffIso = new Date(Date.now() - QUIET_WINDOW_MS).toISOString()
    const { data, error } = await supabase
      .from('messages')
      .select('read_at')
      .eq('conversation_id', conversationId)
      .eq('read_by', recipientUserId)
      .gt('read_at', cutoffIso)
      .limit(1)
      .maybeSingle()
    if (error) return true
    return !data
  } catch {
    return true
  }
}
