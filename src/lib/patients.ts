import "server-only";
import { getDatabase } from "./db";
import { requireAdmin } from "./session";

export type PatientSummary = {
  id: string;
  hn: string;
  first_name: string;
  last_name: string;
  phone: string;
  department: string;
  registered_date: string;
};

export async function listPatients(search: string, page: number) {
  await requireAdmin();
  const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
  const result = await getDatabase().query<PatientSummary>(
    `SELECT id::text, COALESCE(hn, 'ROM-' || lpad(id::text, 8, '0')) AS hn,
      first_name, last_name, phone, department,
      to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI') AS registered_date
     FROM rom_patient
     WHERE $1 = '' OR concat_ws(' ', hn, first_name, last_name, phone,
       'ROM-' || lpad(id::text, 8, '0')) ILIKE $2
     ORDER BY created_at DESC, id DESC LIMIT 21 OFFSET $3`,
    [search, pattern, (page - 1) * 20],
  );
  return { patients: result.rows.slice(0, 20), hasNext: result.rows.length > 20 };
}
