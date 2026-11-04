"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { getDatabase } from "@/lib/db";
import { uploadMasterImage, removeMasterImage, type ImageAsset } from "@/lib/master-images";
import { uuidPattern, validateCourse } from "@/lib/course-validation";

export async function saveCourse(_state: { error: string; message: string }, form: FormData): Promise<{ error: string; message: string }> {
  await requireAdmin();
  const result = validateCourse(form);
  if (!result.data) return { error: result.error!, message: "" };
  const { id, name, price, description } = result.data;
  const mode = form.get("mode");
  if (mode !== "create" && mode !== "update") return { error: "รูปแบบการบันทึกไม่ถูกต้อง", message: "" };
  let image: ImageAsset | null = null;
  try {
    image = await uploadMasterImage(form);
    const saved = mode === "create" ? await getDatabase().query("INSERT INTO rom_course (id, name, price, description, image_asset) VALUES ($1, $2, $3, $4, $5::jsonb) ON CONFLICT (id) DO NOTHING RETURNING id", [id, name, price, description, image ? JSON.stringify(image) : null]) : await getDatabase().query("UPDATE rom_course SET name = $2, price = $3, description = $4, image_asset=COALESCE($5::jsonb, image_asset), updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND archived_at IS NULL RETURNING id", [id, name, price, description, image ? JSON.stringify(image) : null]);
    if (!saved.rowCount && image) await removeMasterImage(image);
    if (mode === "update" && !saved.rowCount) return { error: "ไม่พบคอร์ส หรือคอร์สถูกลบแล้ว", message: "" };
  } catch { if (image) await removeMasterImage(image); return { error: "บันทึกคอร์สไม่สำเร็จ ตรวจสอบรูปภาพและลองอีกครั้ง", message: "" }; }
  revalidatePath("/settings"); revalidatePath("/master-data"); revalidatePath("/registration", "layout");
  return { error: "", message: "บันทึกคอร์สเรียบร้อยแล้ว" };
}

export async function deleteCourse(id: string): Promise<{ error: string }> {
  await requireAdmin();
  if (!uuidPattern.test(id)) return { error: "คอร์สไม่ถูกต้อง" };
  try { await getDatabase().query("UPDATE rom_course SET archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND archived_at IS NULL", [id]); }
  catch { return { error: "ลบคอร์สไม่สำเร็จ กรุณาลองอีกครั้ง" }; }
  revalidatePath("/settings"); revalidatePath("/registration", "layout");
  return { error: "" };
}

export async function assignPatientCourse(patientId: string, courseId: string): Promise<{ error: string }> {
  await requireAdmin();
  if (!/^[1-9]\d{0,18}$/.test(patientId) || BigInt(patientId) > BigInt("9223372036854775807") || (courseId && !uuidPattern.test(courseId))) return { error: "ข้อมูลไม่ถูกต้อง" };
  try {
    const result = await getDatabase().query(
      `UPDATE rom_patient SET course_id = $2::uuid, details = jsonb_set(details, '{service-type}', to_jsonb($3::text), true)
       WHERE id = $1 AND ($2::uuid IS NULL OR EXISTS (SELECT 1 FROM rom_course WHERE id = $2::uuid AND archived_at IS NULL)) RETURNING id`,
      [patientId, courseId || null, courseId ? "course" : "walk-in"],
    );
    if (!result.rowCount) return { error: "ไม่พบผู้ป่วย หรือคอร์สนี้ถูกลบแล้ว" };
  } catch { return { error: "เลือกคอร์สไม่สำเร็จ กรุณาลองอีกครั้ง" }; }
  revalidatePath("/registration"); revalidatePath(`/registration/${patientId}`);
  return { error: "" };
}
