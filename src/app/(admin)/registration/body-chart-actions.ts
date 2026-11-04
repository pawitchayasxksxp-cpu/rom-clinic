"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { getPatient } from "@/lib/patients";
import { getDatabase } from "@/lib/db";
import { validateBodyChart } from "@/lib/body-chart-validation";
export async function saveBodyChart(_state: { error: string }, form: FormData): Promise<{ error: string }> {
  const user = await requireAdmin();
  const result = validateBodyChart(form);
  if (!result.data) return { error: result.error! };
  const data = result.data;
  if (!await getPatient(data.patientId)) return { error: "ไม่พบผู้ป่วย" };
  try { await getDatabase().query("INSERT INTO rom_body_chart (id, patient_id, chart_date, points, note, provider, created_by) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7) ON CONFLICT (id) DO NOTHING", [data.key, data.patientId, data.date, JSON.stringify(data.points), data.note, data.provider, user.id]); }
  catch { return { error: "บันทึก Body Chart ไม่สำเร็จ กรุณาลองอีกครั้ง" }; }
  revalidatePath(`/registration/${data.patientId}`); revalidatePath(`/registration/${data.patientId}/body-chart`);
  redirect(`/body-charts/${data.key}`);
}
