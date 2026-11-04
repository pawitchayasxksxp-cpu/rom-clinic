import "server-only";
import { getDatabase } from "./db";
import { requireAdmin } from "./session";
import type { DrugLabelData } from "./dispensing-validation";

export type DispensingRecord = {
  id: string;
  patient_name: string;
  hn: string;
  drug_name: string;
  details: DrugLabelData;
  date: string;
};

export async function listDispensing() {
  await requireAdmin();
  const result = await getDatabase().query<Omit<DispensingRecord, "details">>(
    `SELECT id, patient_name, hn, drug_name,
      to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI') AS date
     FROM rom_dispensing ORDER BY created_at DESC, id DESC LIMIT 20`,
  );
  return result.rows;
}

export async function getDispensing(id: string) {
  await requireAdmin();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return null;
  const result = await getDatabase().query<DispensingRecord>(
    `SELECT id, patient_name, hn, drug_name, details,
      to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI') AS date
     FROM rom_dispensing WHERE id = $1`, [id],
  );
  return result.rows[0] || null;
}
