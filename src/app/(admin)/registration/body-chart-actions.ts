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
  try {
    if (form.get("mode") === "update") {
      const updated = await getDatabase().query("UPDATE rom_body_chart SET chart_date=$3, points=$4::jsonb, note=$5, provider=$6 WHERE id=$1 AND patient_id=$2 RETURNING id", [data.key, data.patientId, data.date, JSON.stringify(data.points), data.note, data.provider]);
      if (!updated.rowCount) return { error: "ไม่พบ Body Chart ของผู้ป่วยนี้" };
    } else await getDatabase().query("INSERT INTO rom_body_chart (id, patient_id, chart_date, points, note, provider, created_by) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7) ON CONFLICT (id) DO NOTHING", [data.key, data.patientId, data.date, JSON.stringify(data.points), data.note, data.provider, user.id]); }
  catch { return { error: "บันทึก Body Chart ไม่สำเร็จ กรุณาลองอีกครั้ง" }; }
  revalidatePath(`/body-charts/${data.key}`); revalidatePath(`/registration/${data.patientId}`); revalidatePath(`/registration/${data.patientId}/body-chart`);
  redirect(`/body-charts/${data.key}`);
}
