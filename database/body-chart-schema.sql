BEGIN;
CREATE TABLE IF NOT EXISTS rom_body_chart (
  id uuid PRIMARY KEY,
  patient_id bigint NOT NULL REFERENCES rom_patient(id),
  chart_date date NOT NULL,
  points jsonb NOT NULL,
  note text NOT NULL DEFAULT '',
  provider text NOT NULL,
  created_by text NOT NULL REFERENCES rom_auth_user(id),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS rom_body_chart_patient_date_idx ON rom_body_chart(patient_id, chart_date DESC, created_at DESC);
ALTER TABLE rom_body_chart ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE rom_body_chart FROM PUBLIC;
DO $$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE rom_body_chart FROM %I', api_role);
    END IF;
  END LOOP;
END $$;
COMMIT;
