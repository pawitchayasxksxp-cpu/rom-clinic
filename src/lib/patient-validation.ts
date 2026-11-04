import { departments } from "./navigation";

const fields = ["patient-type", "hn", "identity-type", "identity-number", "title", "first-name", "last-name", "birth-date", "sex", "nationality", "marital-status", "occupation", "phone", "email", "registered-line", "registered-subdistrict", "registered-district", "registered-province", "registered-postal-code", "current-line", "current-subdistrict", "current-district", "current-province", "current-postal-code", "emergency-name", "emergency-relationship", "emergency-phone", "coverage", "coverage-provider", "blood-group", "allergy-status", "allergy-details", "conditions", "department", "symptoms", "priority"] as const;

export function validatePatient(form: FormData) {
  const data: Record<string, string> = {};
  for (const field of fields) {
    const value = form.get(field);
    if (value !== null && typeof value !== "string") return { error: "รูปแบบข้อมูลไม่ถูกต้อง" };
    data[field] = (value || "").trim();
    const limit = ["symptoms", "allergy-details", "conditions"].includes(field) ? 2000 : 254;
    if (data[field].length > limit) return { error: "ข้อมูลยาวเกินกำหนด กรุณาย่อข้อความแล้วลองใหม่" };
  }
  if (!["ผู้ป่วยใหม่", "ผู้ป่วยเดิม"].includes(data["patient-type"]) || !data["first-name"] || !data["last-name"] || !data.phone || !data["birth-date"]) return { error: "กรุณากรอกประเภทผู้ป่วย ชื่อ นามสกุล วันเกิด และโทรศัพท์ให้ครบ" };
  const birth = data["birth-date"];
  const date = new Date(`${birth}T00:00:00Z`);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== birth || birth > today || birth < "1850-01-01") return { error: "กรุณาระบุวันเกิดเป็นปี ค.ศ. ที่ถูกต้องและไม่เกินวันนี้" };
  for (const key of ["phone", "emergency-phone"]) {
    if (data[key] && (!/^[+\d\s()-]{7,20}$/.test(data[key]) || data[key].replace(/\D/g, "").length < 7)) return { error: "กรุณาตรวจสอบหมายเลขโทรศัพท์" };
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { error: "รูปแบบอีเมลไม่ถูกต้อง" };
  if (!departments.some(item => item.code === data.department) || !["normal", "urgent"].includes(data.priority)) return { error: "กรุณาเลือกแผนกและระดับความเร่งด่วนให้ถูกต้อง" };
  for (const key of ["registered-postal-code", "current-postal-code"]) {
    if (data[key] && !/^\d{5}$/.test(data[key])) return { error: "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก" };
  }
  if (data["patient-type"] === "ผู้ป่วยเดิม" && !data.hn) return { error: "กรุณาระบุ HN สำหรับผู้ป่วยเดิม" };
  if (data.hn && !/^[A-Za-z0-9/-]{1,30}$/.test(data.hn)) return { error: "HN ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข / หรือ - ไม่เกิน 30 ตัว" };
  return { data };
}
