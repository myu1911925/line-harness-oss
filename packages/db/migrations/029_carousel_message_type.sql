-- Migration 029: Add 'carousel' to message_type CHECK constraints
-- Affects: broadcasts, scenario_steps

PRAGMA foreign_keys=OFF;

-- ① broadcasts テーブル
CREATE TABLE broadcasts_new (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  message_type    TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'flex', 'carousel')),
  message_content TEXT NOT NULL,
  target_type     TEXT NOT NULL CHECK (target_type IN ('all', 'tag')) DEFAULT 'all',
  target_tag_id   TEXT REFERENCES tags (id) ON DELETE SET NULL,
  status          TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')) DEFAULT 'draft',
  scheduled_at    TEXT,
  sent_at         TEXT,
  total_count     INTEGER NOT NULL DEFAULT 0,
  success_count   INTEGER NOT NULL DEFAULT 0,
  line_request_id   TEXT,
  aggregation_unit  TEXT,
  batch_offset    INTEGER NOT NULL DEFAULT 0,
  segment_conditions TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now', '+9 hours'))
);

INSERT INTO broadcasts_new SELECT * FROM broadcasts;
DROP TABLE broadcasts;
ALTER TABLE broadcasts_new RENAME TO broadcasts;
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts (status);

-- ② scenario_steps テーブル
CREATE TABLE scenario_steps_new (
  id              TEXT PRIMARY KEY,
  scenario_id     TEXT NOT NULL REFERENCES scenarios (id) ON DELETE CASCADE,
  step_order      INTEGER NOT NULL,
  delay_minutes   INTEGER NOT NULL DEFAULT 0,
  message_type    TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'flex', 'carousel')),
  message_content TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now', '+9 hours')),
  UNIQUE (scenario_id, step_order)
);

INSERT INTO scenario_steps_new SELECT * FROM scenario_steps;
DROP TABLE scenario_steps;
ALTER TABLE scenario_steps_new RENAME TO scenario_steps;
CREATE INDEX IF NOT EXISTS idx_scenario_steps_scenario_id ON scenario_steps (scenario_id);

PRAGMA foreign_keys=ON;
