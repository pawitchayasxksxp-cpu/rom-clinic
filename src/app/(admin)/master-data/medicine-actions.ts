"use server";
import { requireAdmin } from "@/lib/session";
import { getDatabase } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { validateMedicine } from "@/lib/medicine-validation";
import { uuidPattern } from "@/lib/course-validation";
import { uploadMasterImage, removeMasterImage, type ImageAsset } from "@/lib/master-images";
export async function saveMedicine(_state: { error: string; message: string }, form: FormData): Promise<{ error: string; message: string }> {
  await requireAdmin(); const result = validateMedicine(form); if (!result.data) return { error: result.error!, message: "" };
  const mode = form.get("mode"); if (mode !== "create" && mode !== "update") return { error: "รูปแบบข้อมูลไม่ถูกต้อง", message: "" };
  const originalStock = form.get("original-stock");
  if (mode === "update" && (typeof originalStock !== "string" || !/^\d{1,10}(\.\d{1,2})?$/.test(originalStock))) return {error: "กรุณาโหลดข้อมูลยาใหม่ก่อนแก้ไข",message:""};
  const d = result.data; let image: ImageAsset | null = null;
  try {
    image = await uploadMasterImage(form);
    const params = [d["medicine-id"], d.name, d["dosage-form"], d["form-other"], d.unit, d["unit-other"], d.stock, d.price, d.note, image ? JSON.stringify(image) : null];
    if (mode === "update") params.push(originalStock as string);
    const saved = await getDatabase().query(mode === "create" ? "INSERT INTO rom_medicine (id, name, dosage_form, form_other, unit, unit_other, stock, price, note, image_asset) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb) ON CONFLICT (id) DO NOTHING RETURNING id" : "UPDATE rom_medicine SET name=$2, dosage_form=$3, form_other=$4, unit=$5, unit_other=$6, stock=$7, price=$8, note=$9, image_asset=COALESCE($10::jsonb,image_asset), updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND archived_at IS NULL AND stock=$11::numeric RETURNING id", params);
    if (!saved.rowCount && image) await removeMasterImage(image);
    if (!saved.rowCount && mode === "update") return { error: "ข้อมูลสต๊อกเปลี่ยนแปลง หรือยาถูกลบ กรุณาโหลดหน้าใหม่ก่อนแก้ไข", message: "" };
  } catch { if (image) await removeMasterImage(image); return { error: "บันทึกยาไม่สำเร็จ ตรวจสอบไฟล์รูปและลองอีกครั้ง", message: "" }; }
  revalidatePath("/dispensing"); revalidatePath("/master-data"); return { error: "", message: "บันทึกข้อมูลยาแล้ว" };
}
export async function deleteMedicine(id: string): Promise<{ error: string }> {
  await requireAdmin(); if (!uuidPattern.test(id)) return { error: "ยาไม่ถูกต้อง" };
  try { await getDatabase().query("UPDATE rom_medicine SET archived_at=CURRENT_TIMESTAMP WHERE id=$1 AND archived_at IS NULL", [id]); } catch { return { error: "ลบยาไม่สำเร็จ" }; }
  revalidatePath("/dispensing"); revalidatePath("/master-data"); return { error: "" };
}
