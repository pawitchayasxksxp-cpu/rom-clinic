BEGIN;
CREATE TABLE IF NOT EXISTS rom_examination (
 id uuid PRIMARY KEY, number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
 patient_id bigint NOT NULL REFERENCES rom_patient(id), department text NOT NULL,
 status text NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting','examining','completed','cancelled')),
 treatment_id uuid UNIQUE REFERENCES rom_treatment(id),
 created_by text NOT NULL REFERENCES rom_auth_user(id), created_at timestamptz NOT NULL DEFAULT now(), started_at timestamptz, finished_at timestamptz,
 CHECK((status='completed')=(treatment_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS rom_examination_active_patient_idx ON rom_examination(patient_id) WHERE status IN ('waiting','examining');
CREATE INDEX IF NOT EXISTS rom_examination_created_idx ON rom_examination(created_at DESC);
ALTER TABLE rom_examination ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE rom_examination FROM PUBLIC;
REVOKE ALL ON SEQUENCE rom_examination_number_seq FROM PUBLIC;
DO $$ DECLARE api_role text; BEGIN
 FOREACH api_role IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT FROM pg_roles WHERE rolname=api_role) THEN
   EXECUTE format('REVOKE ALL ON TABLE rom_examination FROM %I',api_role);
   EXECUTE format('REVOKE ALL ON SEQUENCE rom_examination_number_seq FROM %I',api_role);
  END IF;
 END LOOP;
END $$;
COMMIT;
