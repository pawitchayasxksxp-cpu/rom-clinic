BEGIN;
ALTER TABLE rom_course ADD COLUMN IF NOT EXISTS image_asset jsonb;
ALTER TABLE rom_auth_user ADD COLUMN IF NOT EXISTS image_asset jsonb;
CREATE TABLE IF NOT EXISTS rom_medicine (
  id uuid PRIMARY KEY, name text NOT NULL, dosage_form text NOT NULL,
  form_other text NOT NULL DEFAULT '', unit text NOT NULL, unit_other text NOT NULL DEFAULT '',
  stock numeric(12,2) NOT NULL DEFAULT 0 CHECK (stock >= 0),
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  note text NOT NULL DEFAULT '', image_asset jsonb,
  archived_at timestamptz, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE rom_medicine ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE rom_medicine FROM PUBLIC;
DO $$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE rom_medicine FROM %I', api_role);
    END IF;
  END LOOP;
END $$;
COMMIT;
