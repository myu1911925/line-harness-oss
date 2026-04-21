CREATE TABLE IF NOT EXISTS friend_events (
  id              TEXT PRIMARY KEY,
  friend_id       TEXT NOT NULL,
  line_account_id TEXT,
  event_type      TEXT NOT NULL CHECK(event_type IN ('follow', 'unfollow')),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now', '+9 hours'))
);
CREATE INDEX IF NOT EXISTS idx_friend_events_account_date
  ON friend_events(line_account_id, created_at);
