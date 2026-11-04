BEGIN;
ALTER TABLE rom_course ADD COLUMN IF NOT EXISTS total_sessions integer NOT NULL DEFAULT 1 CHECK (total_sessions BETWEEN 1 AND 9999);
ALTER TABLE rom_course ADD COLUMN IF NOT EXISTS validity_days integer CHECK (validity_days BETWEEN 1 AND 3650);
CREATE TABLE IF NOT EXISTS rom_payment (
 id uuid PRIMARY KEY, number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
 patient_id bigint NOT NULL REFERENCES rom_patient(id), patient_name text NOT NULL, hn text NOT NULL,
 items jsonb NOT NULL, subtotal numeric(12,2) NOT NULL CHECK(subtotal>=0),
 discount numeric(12,2) NOT NULL CHECK(discount>=0 AND discount<=subtotal),
 total numeric(12,2) NOT NULL CHECK(total=subtotal-discount),
 received numeric(12,2) NOT NULL CHECK(received>=total), change numeric(12,2) NOT NULL CHECK(change=received-total),
 method text NOT NULL CHECK(method IN ('cash','transfer')), reference text NOT NULL DEFAULT '', note text NOT NULL DEFAULT '',
 cashier text NOT NULL, created_by text NOT NULL REFERENCES rom_auth_user(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rom_payment_dispensing (
 dispensing_id uuid PRIMARY KEY REFERENCES rom_dispensing(id), payment_id uuid NOT NULL REFERENCES rom_payment(id)
);
CREATE TABLE IF NOT EXISTS rom_patient_course (
 id uuid PRIMARY KEY, patient_id bigint NOT NULL REFERENCES rom_patient(id), course_id uuid NOT NULL REFERENCES rom_course(id),
 payment_id uuid NOT NULL REFERENCES rom_payment(id), name text NOT NULL, price numeric(12,2) NOT NULL,
 total_sessions integer NOT NULL CHECK(total_sessions BETWEEN 1 AND 9999),
 remaining integer NOT NULL CHECK(remaining BETWEEN 0 AND total_sessions), expires_on date, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(payment_id,course_id)
);
CREATE TABLE IF NOT EXISTS rom_course_usage (
 id uuid PRIMARY KEY, patient_course_id uuid NOT NULL REFERENCES rom_patient_course(id),
 treatment_id uuid NOT NULL UNIQUE REFERENCES rom_treatment(id),
 created_by text NOT NULL REFERENCES rom_auth_user(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rom_payment_created_idx ON rom_payment(created_at DESC);
CREATE INDEX IF NOT EXISTS rom_patient_course_patient_idx ON rom_patient_course(patient_id);
DO $$
DECLARE tbl text; api_role text;
BEGIN
 FOREACH tbl IN ARRAY ARRAY['rom_payment','rom_payment_dispensing','rom_patient_course','rom_course_usage'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',tbl);
  EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC',tbl);
  FOREACH api_role IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF EXISTS(SELECT FROM pg_roles WHERE rolname=api_role) THEN EXECUTE format('REVOKE ALL ON TABLE %I FROM %I',tbl,api_role); END IF;
  END LOOP;
 END LOOP;
 REVOKE ALL ON SEQUENCE rom_payment_number_seq FROM PUBLIC;
 FOREACH api_role IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT FROM pg_roles WHERE rolname=api_role) THEN EXECUTE format('REVOKE ALL ON SEQUENCE rom_payment_number_seq FROM %I',api_role); END IF;
 END LOOP;
END $$;
COMMIT;
