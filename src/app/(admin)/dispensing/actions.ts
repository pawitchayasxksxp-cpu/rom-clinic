"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getDatabase } from "@/lib/db";
import { validateDispensing } from "@/lib/dispensing-validation";

export async function saveDispensing(_state: { error: string }, form: FormData): Promise<{ error: string }> {
  const user = await requireAdmin();
  const result = validateDispensing(form);
  if (!result.data) return { error: result.error! };
  let patientId = "";
  try {
    const saved = await getDatabase().query(
      `INSERT INTO rom_dispensing (id, patient_id, patient_name, hn, drug_name, details, created_by)
       SELECT $1::uuid, id, concat_ws(' ', first_name, last_name),
         COALESCE(hn, 'ROM-' || lpad(id::text, 8, '0')), $3, $4::jsonb, $5
       FROM rom_patient WHERE COALESCE(hn, 'ROM-' || lpad(id::text, 8, '0')) = $2
       ON CONFLICT (id) DO UPDATE SET id = rom_dispensing.id RETURNING id, patient_id::text`,
      [result.key, result.hn, result.data["drug-name"], JSON.stringify(result.data), user.id],
    );
    if (!saved.rowCount) return { error: "ไม่พบผู้ป่วย กรุณาเลือกจากรายชื่ออีกครั้ง" };
    patientId = saved.rows[0].patient_id;
  } catch { return { error: "บันทึกการจ่ายยาไม่สำเร็จ กรุณาลองอีกครั้ง" }; }
  revalidatePath("/dispensing");
  revalidatePath(`/registration/${patientId}`);
  redirect(`/dispensing/${result.key}${form.get("print-after-save") === "1" ? "?print=1" : ""}`);
}
