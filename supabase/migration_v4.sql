-- v4 migration: track who reviewed each PTO and remote request

ALTER TABLE pto_requests ADD COLUMN IF NOT EXISTS reviewed_by text;
ALTER TABLE pto_requests ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE remote_requests ADD COLUMN IF NOT EXISTS reviewed_by text;
ALTER TABLE remote_requests ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
