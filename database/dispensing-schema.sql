-- Apply with npm run db:migrate:dispensing after the patient migration.
BEGIN;
CREATE TABLE IF NOT EXISTS rom_dispensing (
  id uuid PRIMARY KEY,
  patient_id bigint NOT NULL REFERENCES rom_patient(id),
  patient_name text NOT NULL,
  hn text NOT NULL,
  drug_name text NOT NULL,
  details jsonb NOT NULL,
  created_by text NOT NULL REFERENCES rom_auth_user(id),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS rom_dispensing_created_at_idx ON rom_dispensing(created_at DESC);
ALTER TABLE rom_dispensing ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE rom_dispensing FROM PUBLIC;
DO $$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE rom_dispensing FROM %I', api_role);
    END IF;
  END LOOP;
END $$;
COMMIT;
