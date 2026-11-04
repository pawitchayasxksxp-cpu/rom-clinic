-- Apply explicitly with npm run db:migrate:bookings after the patient migration.
BEGIN;
CREATE TABLE IF NOT EXISTS rom_booking (
  id uuid PRIMARY KEY,
  patient_id bigint NOT NULL REFERENCES rom_patient(id),
  starts_at timestamptz NOT NULL,
  department text NOT NULL CHECK (department IN ('GN', 'MS', 'SP', 'TM', 'DT', 'ER', 'PD')),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS rom_booking_starts_at_idx ON rom_booking(starts_at);
CREATE UNIQUE INDEX IF NOT EXISTS rom_booking_patient_time_idx ON rom_booking(patient_id, starts_at) WHERE status <> 'cancelled';
-- New service codes plus historical codes used by existing records.
ALTER TABLE rom_booking DROP CONSTRAINT IF EXISTS rom_booking_department_check;
ALTER TABLE rom_booking ADD CONSTRAINT rom_booking_department_check CHECK (department IN ('GN', 'MS', 'SP', 'TM', 'DT', 'ER', 'PD'));
ALTER TABLE rom_booking ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE rom_booking FROM PUBLIC;
DO $$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE rom_booking FROM %I', api_role);
    END IF;
  END LOOP;
END $$;
COMMIT;
