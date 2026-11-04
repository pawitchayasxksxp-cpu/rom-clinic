ALTER TABLE rom_dispensing ADD COLUMN IF NOT EXISTS medicine_id uuid REFERENCES rom_medicine(id);
CREATE INDEX IF NOT EXISTS rom_dispensing_medicine_idx ON rom_dispensing(medicine_id);
