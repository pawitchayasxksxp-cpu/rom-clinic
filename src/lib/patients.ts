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
  course_id: string | null;
  course_name: string | null;
  course_price: string | null;
  course_balance: string | null;
};

export async function listPatients(search: string, page: number) {
  await requireAdmin();
  const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
  const result = await getDatabase().query<PatientSummary>(
    `SELECT p.id::text, COALESCE(p.hn, 'ROM-' || lpad(p.id::text, 8, '0')) AS hn,
      p.first_name, p.last_name, p.phone, p.department,
      p.details->>'service-type' AS service_type, p.course_id::text, c.name AS course_name, c.price::text AS course_price,
      (SELECT string_agg(pc.name || ' · ' || pc.remaining::text || '/' || pc.total_sessions::text || ' ครั้ง', E'\n' ORDER BY pc.created_at DESC) FROM rom_patient_course pc WHERE pc.patient_id=p.id AND pc.remaining>0 AND (pc.expires_on IS NULL OR pc.expires_on >= (now() AT TIME ZONE 'Asia/Bangkok')::date)) AS course_balance,
      p.details->>'bp-systolic' AS bp_systolic, p.details->>'bp-diastolic' AS bp_diastolic, p.details->>'pulse' AS pulse,
      to_char(p.created_at AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI') AS registered_date
     FROM rom_patient p LEFT JOIN rom_course c ON c.id = p.course_id
     WHERE p.deleted_at IS NULL AND ($1 = '' OR concat_ws(' ', p.hn, p.first_name, p.last_name, p.phone,
       'ROM-' || lpad(p.id::text, 8, '0')) ILIKE $2)
     ORDER BY p.created_at DESC, p.id DESC LIMIT 21 OFFSET $3`,
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
  course_id: string | null;
  details: Record<string, unknown>;
};

export async function getPatient(id: string): Promise<PatientDetail | null> {
  await requireAdmin();
  if (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > BigInt("9223372036854775807")) return null;
  const result = await getDatabase().query<PatientDetail>(
    `SELECT id::text, COALESCE(hn, 'ROM-' || lpad(id::text, 8, '0')) AS hn,
      first_name, last_name, to_char(birth_date, 'YYYY-MM-DD') AS birth_date,
      phone, department, details, course_id::text,
      to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI') AS registered_date
     FROM rom_patient WHERE id = $1 AND deleted_at IS NULL`,
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
     WHERE deleted_at IS NULL AND ($1 = '' OR concat_ws(' ', hn, first_name, last_name, phone,
       'ROM-' || lpad(id::text, 8, '0')) ILIKE $2)
     ORDER BY created_at DESC, id DESC LIMIT 21`,
    [search, pattern],
  );
  return { patients: result.rows.slice(0, 20), hasMore: result.rows.length > 20 };
}

export async function patientHnPreview() {
  await requireAdmin();
  const result = await getDatabase().query<{ next: string; latest: string | null }>(
    `SELECT 'CN-' || lpad(next_number::text, greatest(6, length(next_number::text)), '0') AS next,
      (SELECT hn FROM rom_patient WHERE hn ~ '^CN-[0-9]+$' ORDER BY substring(hn FROM '^CN-([0-9]+)$')::bigint DESC LIMIT 1) AS latest
     FROM (SELECT last_value, is_called, CASE WHEN is_called THEN last_value + 1 ELSE last_value END AS next_number FROM rom_patient_hn_seq) AS numbering`,
  );
  return result.rows[0];
}
