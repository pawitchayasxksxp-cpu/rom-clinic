-- Apply explicitly with npm run db:migrate:patients.
BEGIN;
CREATE TABLE IF NOT EXISTS rom_patient (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hn text UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date NOT NULL,
  phone text NOT NULL,
  department text NOT NULL CHECK (department IN ('GN', 'DT', 'ER', 'PD')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  registration_key uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE rom_patient ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE rom_patient FROM PUBLIC;
REVOKE ALL ON SEQUENCE rom_patient_id_seq FROM PUBLIC;
DO $$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE rom_patient FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON SEQUENCE rom_patient_id_seq FROM %I', api_role);
    END IF;
  END LOOP;
END $$;
COMMIT;
