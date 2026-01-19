-- Add attachments column to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN messages.attachments IS 'Array of attachment URLs (images, videos, files)';
