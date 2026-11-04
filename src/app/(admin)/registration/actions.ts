"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { validatePatient } from "@/lib/patient-validation";

export async function registerPatient(_state: { error: string }, form: FormData): Promise<{ error: string }> {
  await requireAdmin();
  const result = validatePatient(form);
  if (!result.data) return { error: result.error! };
  const key = form.get("registration-key");
  if (typeof key !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) return { error: "กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง" };
  const data = result.data;
  try {
    await getDatabase().query(
      `WITH next_patient AS (SELECT nextval(pg_get_serial_sequence('rom_patient', 'id')) AS id)
       INSERT INTO rom_patient (id, hn, first_name, last_name, birth_date, phone, department, details, registration_key)
       OVERRIDING SYSTEM VALUE
       SELECT id, COALESCE($1, 'ROM-' || lpad(id::text, 8, '0')), $2, $3, $4::date, $5, $6, $7::jsonb, $8::uuid FROM next_patient
       ON CONFLICT (registration_key) DO NOTHING`,
      [data.hn || null, data["first-name"], data["last-name"], data["birth-date"], data.phone, data.department, JSON.stringify(data), key],
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return { error: "HN นี้มีอยู่แล้ว กรุณาตรวจสอบรายชื่อผู้ป่วยก่อนลงทะเบียนซ้ำ" };
    return { error: "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง ข้อมูลที่กรอกยังอยู่ในฟอร์ม" };
  }
  revalidatePath("/registration");
  redirect("/registration?saved=1");
}
