CREATE TABLE IF NOT EXISTS enquiries (
 id uuid PRIMARY KEY,name text NOT NULL,phone text NOT NULL,email text NOT NULL DEFAULT '',
 service text NOT NULL,destination text NOT NULL,offer text NOT NULL,method text NOT NULL,
 message text NOT NULL DEFAULT '',locale text NOT NULL,created_at bigint NOT NULL,profile jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS enquiries_created_at ON enquiries(created_at DESC);
CREATE TABLE IF NOT EXISTS rate_limits(key text PRIMARY KEY,count integer NOT NULL,expires bigint NOT NULL);
CREATE INDEX IF NOT EXISTS rate_limits_expires ON rate_limits(expires);

ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS profile jsonb NOT NULL DEFAULT '{}'::jsonb;
