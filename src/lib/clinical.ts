import "server-only";
import { getDatabase } from "./db";
import { requireAdmin } from "./session";

export type ClinicalEvent = { id: string; kind: "treatment" | "dispensing" | "certificate" | "body-chart"; date: string; department: string | null; details: Record<string, string> };
export type Certificate = { id: string; patient_id: string; number: string; snapshot: Record<string, string>; details: Record<string, string> };

export async function patientHistory(patientId: string, page: number) {
  await requireAdmin();
  const result = await getDatabase().query<ClinicalEvent>(
    `WITH events AS (
      SELECT t.id, 'treatment' AS kind, t.visit_at AS occurred_at, t.department, t.details || CASE WHEN c.id IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('course-used',c.name) END AS details
      FROM rom_treatment t LEFT JOIN rom_course_usage u ON u.treatment_id=t.id LEFT JOIN rom_patient_course c ON c.id=u.patient_course_id WHERE t.patient_id = $1
      UNION ALL
      SELECT id, 'dispensing', created_at, NULL, details FROM rom_dispensing WHERE patient_id = $1
      UNION ALL
      SELECT id, 'certificate', created_at, NULL, details || jsonb_build_object('number', 'MC-' || lpad(number::text, greatest(6, length(number::text)), '0'))
      FROM rom_certificate WHERE patient_id = $1
      UNION ALL
      SELECT id, 'body-chart', created_at, NULL, jsonb_build_object('provider', provider, 'count', jsonb_array_length(points)::text, 'chart-date', to_char(chart_date, 'DD/MM/YYYY')) FROM rom_body_chart WHERE patient_id = $1
     ) SELECT id, kind, to_char(occurred_at AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI') AS date, department, details
       FROM events ORDER BY occurred_at DESC, kind, id DESC LIMIT 11 OFFSET $2`,
    [patientId, (page - 1) * 10],
  );
  return { events: result.rows.slice(0, 10), hasNext: result.rows.length > 10 };
}

export async function getCertificate(id: string): Promise<Certificate | null> {
  await requireAdmin();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return null;
  const result = await getDatabase().query<Certificate>(
    `SELECT id, patient_id::text, 'MC-' || lpad(number::text, greatest(6, length(number::text)), '0') AS number,
      patient_snapshot AS snapshot, details FROM rom_certificate WHERE id = $1`, [id],
  );
  return result.rows[0] || null;
}
