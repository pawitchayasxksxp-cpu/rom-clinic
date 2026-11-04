-- Apply with npm run db:migrate:clinical after patient and dispensing migrations.
BEGIN;
CREATE TABLE IF NOT EXISTS rom_treatment (
  id uuid PRIMARY KEY,
  patient_id bigint NOT NULL REFERENCES rom_patient(id),
  visit_at timestamptz NOT NULL,
  department text NOT NULL CHECK (department IN ('GN', 'MS', 'SP', 'TM')),
  details jsonb NOT NULL,
  created_by text NOT NULL REFERENCES rom_auth_user(id),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS rom_treatment_patient_visit_idx ON rom_treatment(patient_id, visit_at DESC);
CREATE TABLE IF NOT EXISTS rom_certificate (
  id uuid PRIMARY KEY,
  number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  patient_id bigint NOT NULL REFERENCES rom_patient(id),
  patient_snapshot jsonb NOT NULL,
  issue_date date NOT NULL,
  details jsonb NOT NULL,
  created_by text NOT NULL REFERENCES rom_auth_user(id),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS rom_certificate_patient_idx ON rom_certificate(patient_id, created_at DESC);
ALTER TABLE rom_treatment ENABLE ROW LEVEL SECURITY;
ALTER TABLE rom_certificate ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE rom_treatment, rom_certificate FROM PUBLIC;
REVOKE ALL ON SEQUENCE rom_certificate_number_seq FROM PUBLIC;
DO $$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE rom_treatment, rom_certificate FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON SEQUENCE rom_certificate_number_seq FROM %I', api_role);
    END IF;
  END LOOP;
END $$;
COMMIT;
