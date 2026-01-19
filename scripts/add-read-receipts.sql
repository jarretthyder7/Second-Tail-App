-- Add read receipt tracking to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS read_by uuid REFERENCES profiles(id);

-- Create index for faster read status queries
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);
CREATE INDEX IF NOT EXISTS idx_messages_read_by ON messages(read_by);

-- Update RLS policies to allow marking messages as read
DROP POLICY IF EXISTS "Users can update message read status" ON messages;
CREATE POLICY "Users can update message read status"
ON messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);
