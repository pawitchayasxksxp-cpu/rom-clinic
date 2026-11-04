-- Apply explicitly with npm run db:migrate:patients.
BEGIN;
CREATE TABLE IF NOT EXISTS rom_patient (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hn text UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date NOT NULL,
  phone text NOT NULL,
  department text NOT NULL CHECK (department IN ('GN', 'MS', 'SP', 'TM', 'DT', 'ER', 'PD')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  registration_key uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Preserve existing CNs. Reapplying this migration never resets numbering.
LOCK TABLE rom_patient IN ACCESS EXCLUSIVE MODE;
CREATE SEQUENCE IF NOT EXISTS rom_patient_hn_seq START WITH 1;
SELECT setval('rom_patient_hn_seq',
  GREATEST(last_value, COALESCE((SELECT MAX(substring(hn FROM '^[HC]N-([0-9]+)$')::bigint) FROM rom_patient), 0)),
  is_called OR EXISTS (SELECT 1 FROM rom_patient WHERE hn ~ '^[HC]N-[0-9]+$'))
FROM rom_patient_hn_seq;
-- Evaluate nextval once; expand the number past six digits without truncation.
CREATE OR REPLACE FUNCTION rom_next_patient_hn() RETURNS text
LANGUAGE sql VOLATILE AS $$
  SELECT 'CN-' || lpad(number::text, greatest(6, length(number::text)), '0')
  FROM (SELECT nextval('rom_patient_hn_seq') AS number) AS next_hn;
$$;
ALTER TABLE rom_patient ALTER COLUMN hn SET DEFAULT rom_next_patient_hn();
-- New service codes plus historical codes used by existing records.
ALTER TABLE rom_patient DROP CONSTRAINT IF EXISTS rom_patient_department_check;
ALTER TABLE rom_patient ADD CONSTRAINT rom_patient_department_check CHECK (department IN ('GN', 'MS', 'SP', 'TM', 'DT', 'ER', 'PD'));
ALTER TABLE rom_patient ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE rom_patient FROM PUBLIC;
REVOKE ALL ON SEQUENCE rom_patient_id_seq FROM PUBLIC;
REVOKE ALL ON SEQUENCE rom_patient_hn_seq FROM PUBLIC;
REVOKE ALL ON FUNCTION rom_next_patient_hn() FROM PUBLIC;
DO $$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE rom_patient FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON SEQUENCE rom_patient_id_seq FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON SEQUENCE rom_patient_hn_seq FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON FUNCTION rom_next_patient_hn() FROM %I', api_role);
    END IF;
  END LOOP;
END $$;
COMMIT;
