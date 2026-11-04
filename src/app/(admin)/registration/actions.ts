"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { getPatient } from "@/lib/patients";
import { validatePatient } from "@/lib/patient-validation";

export async function registerPatient(_state: { error: string }, form: FormData): Promise<{ error: string }> {
  await requireAdmin();
  const result = validatePatient(form);
  if (!result.data) return { error: result.error! };
  const key = form.get("registration-key");
  if (typeof key !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) return { error: "กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง" };
  const data = result.data;
  try {
    const saved = await getDatabase().query(
      `INSERT INTO rom_patient (first_name, last_name, birth_date, phone, department, details, registration_key, course_id)
       SELECT $1, $2, $3::date, $4, $5, $6::jsonb, $7::uuid, $8::uuid
       WHERE $8::uuid IS NULL OR EXISTS (SELECT 1 FROM rom_course WHERE id = $8::uuid AND archived_at IS NULL)
       ON CONFLICT (registration_key) DO UPDATE SET registration_key = rom_patient.registration_key RETURNING id`,
      [data["first-name"], data["last-name"], data["birth-date"], data.phone, data.department, JSON.stringify(data), key, data["course-id"] || null],
    );
    if (!saved.rowCount) return { error: "คอร์สนี้ถูกลบแล้ว กรุณาเลือกคอร์สใหม่" };
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
      `UPDATE rom_patient SET details = jsonb_set(details, '{service-type}', to_jsonb($2::text), true), course_id = CASE WHEN $2 = 'walk-in' THEN NULL ELSE course_id END WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
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

export async function updatePatient(id: string, _state: { error: string }, form: FormData): Promise<{ error: string }> {
  await requireAdmin();
  const patient = await getPatient(id);
  if (!patient) return { error: "ไม่พบข้อมูลผู้ป่วย กรุณากลับไปที่รายชื่อผู้ป่วย" };
  const result = validatePatient(form, { legacyDepartment: patient.department });
  if (!result.data) return { error: result.error! };
  const data = result.data;
  try {
    const updated = await getDatabase().query(
      `UPDATE rom_patient SET first_name = $2, last_name = $3, birth_date = $4::date,
        phone = $5, department = $6, details = details || $7::jsonb, course_id = $8::uuid
       WHERE id = $1 AND deleted_at IS NULL AND ($8::uuid IS NULL OR $8::uuid = course_id OR EXISTS (SELECT 1 FROM rom_course WHERE id = $8::uuid AND archived_at IS NULL)) RETURNING id`,
      [id, data["first-name"], data["last-name"], data["birth-date"], data.phone, data.department, JSON.stringify(data), data["course-id"] || null],
    );
    if (!updated.rowCount) return { error: "ไม่พบผู้ป่วย หรือคอร์สถูกลบแล้ว กรุณาตรวจสอบอีกครั้ง" };
  } catch { return { error: "บันทึกการแก้ไขไม่สำเร็จ กรุณาลองอีกครั้ง ข้อมูลที่กรอกยังอยู่ในฟอร์ม" }; }
  for (const path of ["/registration", `/registration/${id}`, `/registration/${id}/edit`, "/calendar", "/dashboard"]) revalidatePath(path);
  redirect(`/registration/${id}?saved=1`);
}

export async function deletePatient(id: string): Promise<{error: string}> {
  const user = await requireAdmin();
  if (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > BigInt("9223372036854775807")) return {error: "ข้อมูลผู้ป่วยไม่ถูกต้อง"};
  try {
    const deleted = await getDatabase().query("UPDATE rom_patient SET deleted_at=CURRENT_TIMESTAMP, deleted_by=$2 WHERE id=$1 AND deleted_at IS NULL RETURNING id", [id,user.id]);
    if (!deleted.rowCount) return {error: "ไม่พบผู้ป่วย หรือข้อมูลถูกลบแล้ว"};
  } catch {return {error: "ลบข้อมูลผู้ป่วยไม่สำเร็จ กรุณาลองอีกครั้ง"};}
  for (const path of ["/registration",`/registration/${id}`,"/calendar","/dashboard","/dispensing"]) revalidatePath(path);
  redirect("/registration?deleted=1");
}
