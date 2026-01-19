-- Add team field to conversations table so messages can be linked to teams
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS team TEXT,
ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES profiles(id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_team ON conversations(team);
CREATE INDEX IF NOT EXISTS idx_conversations_recipient ON conversations(recipient_id);

-- Update RLS policy to allow fosters to insert conversations
DROP POLICY IF EXISTS "Foster users can create conversations" ON conversations;
CREATE POLICY "Foster users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT foster_id FROM dogs WHERE dogs.id = dog_id
    )
  );
