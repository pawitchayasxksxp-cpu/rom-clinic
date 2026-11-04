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
  bp_systolic: string | null;
  bp_diastolic: string | null;
  pulse: string | null;
  service_type: string | null;
};

export async function listPatients(search: string, page: number) {
  await requireAdmin();
  const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
  const result = await getDatabase().query<PatientSummary>(
    `SELECT id::text, COALESCE(hn, 'ROM-' || lpad(id::text, 8, '0')) AS hn,
      first_name, last_name, phone, department,
      details->>'service-type' AS service_type,
      details->>'bp-systolic' AS bp_systolic, details->>'bp-diastolic' AS bp_diastolic, details->>'pulse' AS pulse,
      to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI') AS registered_date
     FROM rom_patient
     WHERE $1 = '' OR concat_ws(' ', hn, first_name, last_name, phone,
       'ROM-' || lpad(id::text, 8, '0')) ILIKE $2
     ORDER BY created_at DESC, id DESC LIMIT 21 OFFSET $3`,
    [search, pattern, (page - 1) * 20],
  );
  return { patients: result.rows.slice(0, 20), hasNext: result.rows.length > 20 };
}

export type PatientDetail = {
  id: string;
  hn: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  phone: string;
  department: string;
  registered_date: string;
  details: Record<string, unknown>;
};

export async function getPatient(id: string): Promise<PatientDetail | null> {
  await requireAdmin();
  if (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > BigInt("9223372036854775807")) return null;
  const result = await getDatabase().query<PatientDetail>(
    `SELECT id::text, COALESCE(hn, 'ROM-' || lpad(id::text, 8, '0')) AS hn,
      first_name, last_name, to_char(birth_date, 'YYYY-MM-DD') AS birth_date,
      phone, department, details,
      to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI') AS registered_date
     FROM rom_patient WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export type PatientChoice = { id: string; hn: string; first_name: string; last_name: string };

export async function searchPatientChoices(search: string) {
  await requireAdmin();
  const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
  const result = await getDatabase().query<PatientChoice>(
    `SELECT id::text, COALESCE(hn, 'ROM-' || lpad(id::text, 8, '0')) AS hn,
      first_name, last_name
     FROM rom_patient
     WHERE $1 = '' OR concat_ws(' ', hn, first_name, last_name, phone,
       'ROM-' || lpad(id::text, 8, '0')) ILIKE $2
     ORDER BY created_at DESC, id DESC LIMIT 21`,
    [search, pattern],
  );
  return { patients: result.rows.slice(0, 20), hasMore: result.rows.length > 20 };
}
