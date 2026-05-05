-- Web Push subscriptions, one row per browser/device per user.
-- The endpoint is the push-service URL the browser hands us; it's globally
-- unique per device, so we use it as the natural primary key.
--
-- A single user can have many rows (laptop + phone + work computer). When a
-- subscription becomes stale (410 from the push service), the server-side
-- send loop deletes it.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint     TEXT PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- A user can see/manage only their own subscriptions. Server-side push
-- delivery uses the service-role key and bypasses RLS, which is intentional —
-- we need to fetch any user's subscriptions to send them a notification.
DROP POLICY IF EXISTS "Users manage own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users manage own push subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
