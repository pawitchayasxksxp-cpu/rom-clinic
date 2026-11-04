BEGIN;
CREATE TABLE IF NOT EXISTS rom_course (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  description text NOT NULL DEFAULT '',
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE rom_patient ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES rom_course(id);
ALTER TABLE rom_course ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE rom_course FROM PUBLIC;
DO $$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE rom_course FROM %I', api_role);
    END IF;
  END LOOP;
END $$;
COMMIT;
