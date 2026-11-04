"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { getDatabase } from "@/lib/db";
import { validateProfessional } from "@/lib/professional-validation";
export async function saveProfessional(_state: { error: string; message: string }, form: FormData): Promise<{ error: string; message: string }> {
  await requireAdmin(); const userId = form.get("user-id");
  if (typeof userId !== "string" || userId.length > 128) return { error: "บัญชีแอดมินไม่ถูกต้อง", message: "" };
  const result = validateProfessional(form); if (result.error) return { error: result.error, message: "" };
  try {
    if (result.data) {
      const saved = await getDatabase().query("INSERT INTO rom_admin_professional (user_id, details) SELECT id, $2::jsonb FROM rom_auth_user WHERE id = $1 AND role = 'admin' ON CONFLICT (user_id) DO UPDATE SET details = EXCLUDED.details, updated_at = CURRENT_TIMESTAMP RETURNING user_id", [userId, JSON.stringify(result.data)]);
      if (!saved.rowCount) return { error: "ไม่พบแอดมิน", message: "" };
    } else await getDatabase().query("DELETE FROM rom_admin_professional WHERE user_id = $1", [userId]);
  } catch { return { error: "บันทึกใบประกอบวิชาชีพไม่สำเร็จ กรุณาลองอีกครั้ง", message: "" }; }
  revalidatePath("/settings"); revalidatePath("/master-data");
  return { error: "", message: "บันทึกข้อมูลใบประกอบวิชาชีพแล้ว" };
}
