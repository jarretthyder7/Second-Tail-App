-- Create newsletters table to store sent newsletters
CREATE TABLE IF NOT EXISTS newsletters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  intro_message TEXT,
  html_content TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  recipient_count INTEGER DEFAULT 0,
  animal_ids TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create newsletter_recipients table to track individual sends
CREATE TABLE IF NOT EXISTS newsletter_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  newsletter_id UUID NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_id UUID REFERENCES profiles(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  email_id TEXT,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS newsletters_org_id_idx ON newsletters(organization_id);
CREATE INDEX IF NOT EXISTS newsletters_status_idx ON newsletters(status);
CREATE INDEX IF NOT EXISTS newsletters_scheduled_for_idx ON newsletters(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS newsletter_recipients_newsletter_id_idx ON newsletter_recipients(newsletter_id);
CREATE INDEX IF NOT EXISTS newsletter_recipients_status_idx ON newsletter_recipients(status);

COMMIT;
