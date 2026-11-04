BEGIN;
CREATE TABLE IF NOT EXISTS rom_admin_professional (
  user_id text PRIMARY KEY REFERENCES rom_auth_user(id) ON DELETE CASCADE,
  details jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE rom_admin_professional ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE rom_admin_professional FROM PUBLIC;
DO $$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE rom_admin_professional FROM %I', api_role);
    END IF;
  END LOOP;
END $$;
COMMIT;
