import { medicationForms, medicationUnits } from "./medication-options";
import { uuidPattern } from "./course-validation";
export function validateMedicine(form: FormData) {
  const data: Record<string, string> = {};
  for (const key of ["medicine-id", "name", "dosage-form", "form-other", "unit", "unit-other", "stock", "price", "note"]) {
    const raw = form.get(key); if (raw !== null && typeof raw !== "string") return { error: "ข้อมูลยาไม่ถูกต้อง" };
    data[key] = (raw || "").trim(); if (data[key].length > (key === "note" ? 2000 : 200)) return { error: "ข้อความยาวเกินกำหนด" };
  }
  if (!uuidPattern.test(data["medicine-id"]) || !data.name || !medicationForms.some(value => value === data["dosage-form"]) || !medicationUnits.some(value => value === data.unit)) return { error: "กรุณากรอกชื่อยา รูปแบบยา และหน่วยให้ครบ" };
  if ((data["dosage-form"] === "อื่น ๆ" && !data["form-other"]) || (data.unit === "อื่น ๆ" && !data["unit-other"])) return { error: "กรุณากรอกหมายเหตุสำหรับตัวเลือกอื่น ๆ" };
  for (const key of ["stock", "price"]) if (!/^\d{1,9}(\.\d{1,2})?$/.test(data[key])) return { error: "จำนวนคงคลังและราคาต้องตั้งแต่ 0 และมีทศนิยมไม่เกิน 2 ตำแหน่ง" };
  return { data };
}
