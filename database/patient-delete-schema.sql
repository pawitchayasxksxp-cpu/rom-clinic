-- Keep clinical history and HN allocation intact when removing a patient from active use.
ALTER TABLE rom_patient ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE rom_patient ADD COLUMN IF NOT EXISTS deleted_by text REFERENCES rom_auth_user(id);
