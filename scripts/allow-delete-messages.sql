-- Allow either party in a conversation to delete a message in it.
-- "Either party" = the foster assigned to the conversation's dog, OR any
-- rescue staff member of the conversation's org. Both sides can delete
-- messages from the other side per product spec.
--
-- Hard delete (not soft delete) — when a row is removed, postgres_changes
-- fires DELETE events on both clients via realtime, and the message
-- disappears from both UIs.
DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON messages;
CREATE POLICY "Users can delete messages in their conversations"
ON messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM conversations c
    LEFT JOIN dogs d ON d.id = c.dog_id
    WHERE c.id = messages.conversation_id
      AND (
        d.foster_id = auth.uid()
        OR c.organization_id IN (
          SELECT organization_id
          FROM profiles
          WHERE id = auth.uid() AND role = 'rescue'
        )
      )
  )
);
