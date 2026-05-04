-- Adds a join table for multi-staff participation in foster conversations.
-- Original model: conversations.recipient_id = the single rescue staff person.
-- New model: recipient_id stays as the "primary" contact, but additional staff
-- can be added as participants so the foster can see who's in the chat and
-- multiple staff can chime in.
--
-- Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation
  ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user
  ON conversation_participants(user_id);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Anyone in the same org as the conversation can view participants. Mutations are
-- gated server-side via API routes that use the service-role client, so we don't
-- need RLS write policies for routine adds.
DROP POLICY IF EXISTS "Org members can view conversation participants"
  ON conversation_participants;
CREATE POLICY "Org members can view conversation participants"
ON conversation_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN profiles p ON p.organization_id = c.organization_id
    WHERE c.id = conversation_participants.conversation_id
      AND p.id = auth.uid()
  )
);

-- Foster who's the conversation subject also sees participants (they need to know
-- who's in the chat with them).
DROP POLICY IF EXISTS "Foster can view participants of their own conversations"
  ON conversation_participants;
CREATE POLICY "Foster can view participants of their own conversations"
ON conversation_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN dogs d ON d.id = c.dog_id
    WHERE c.id = conversation_participants.conversation_id
      AND d.foster_id = auth.uid()
  )
);

COMMIT;
