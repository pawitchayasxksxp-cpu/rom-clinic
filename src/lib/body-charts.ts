import "server-only";
import { requireAdmin } from "./session";
import { getDatabase } from "./db";
import { uuidPattern } from "./course-validation";
import type { BodyPoint } from "./body-chart-validation";
export type BodyChart = { id: string; patient_id: string; patient_name: string; hn: string; date: string; date_iso: string; points: BodyPoint[]; note: string; provider: string };
export async function listBodyCharts(patientId: string, page: number) {
  await requireAdmin();
  const result = await getDatabase().query<{ id: string; date: string; provider: string; count: number }>("SELECT id, to_char(chart_date, 'DD/MM/YYYY') AS date, provider, jsonb_array_length(points) AS count FROM rom_body_chart WHERE patient_id = $1 ORDER BY chart_date DESC, created_at DESC, id DESC LIMIT 11 OFFSET $2", [patientId, (page - 1) * 10]);
  return { charts: result.rows.slice(0, 10), hasNext: result.rows.length > 10 };
}
export async function getBodyChart(id: string): Promise<BodyChart | null> {
  await requireAdmin();
  if (!uuidPattern.test(id)) return null;
  const result = await getDatabase().query<BodyChart>("SELECT b.id, b.patient_id::text, concat_ws(' ', p.first_name, p.last_name) AS patient_name, COALESCE(p.hn, 'ROM-' || lpad(p.id::text, 8, '0')) AS hn, to_char(b.chart_date, 'DD/MM/YYYY') AS date, to_char(b.chart_date, 'YYYY-MM-DD') AS date_iso, b.points, b.note, b.provider FROM rom_body_chart b JOIN rom_patient p ON p.id = b.patient_id WHERE b.id = $1", [id]);
  return result.rows[0] || null;
}
