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
      `INSERT INTO rom_patient (first_name, last_name, birth_date, phone, department, details, registration_key)
       VALUES ($1, $2, $3::date, $4, $5, $6::jsonb, $7::uuid)
       ON CONFLICT (registration_key) DO NOTHING`,
      [data["first-name"], data["last-name"], data["birth-date"], data.phone, data.department, JSON.stringify(data), key],
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return { error: "HN นี้มีอยู่แล้ว กรุณาตรวจสอบรายชื่อผู้ป่วยก่อนลงทะเบียนซ้ำ" };
    return { error: "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง ข้อมูลที่กรอกยังอยู่ในฟอร์ม" };
  }
  revalidatePath("/registration");
  redirect("/registration?saved=1");
}

export async function updatePatientService(id: string, service: string): Promise<{ error: string }> {
  await requireAdmin();
  if (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > BigInt("9223372036854775807") || !["walk-in", "course"].includes(service)) return { error: "ข้อมูลประเภทบริการไม่ถูกต้อง" };
  try {
    const result = await getDatabase().query(
      `UPDATE rom_patient SET details = jsonb_set(details, '{service-type}', to_jsonb($2::text), true) WHERE id = $1 RETURNING id`,
      [id, service],
    );
    if (!result.rowCount) return { error: "ไม่พบข้อมูลผู้ป่วย" };
  } catch {
    return { error: "บันทึกประเภทบริการไม่สำเร็จ กรุณาลองอีกครั้ง" };
  }
  revalidatePath("/registration");
  revalidatePath(`/registration/${id}`);
  return { error: "" };
}
