import { patientOtherFields } from "./patient-field-display";
import { departments } from "./navigation";

const fields = ["patient-type", "service-type", "course-id", "identity-type", "identity-number", "title", "first-name", "last-name", "birth-date", "sex", "nationality", "marital-status", "occupation", "phone", "email", "registered-line", "registered-subdistrict", "registered-district", "registered-province", "registered-postal-code", "current-line", "current-subdistrict", "current-district", "current-province", "current-postal-code", "emergency-name", "emergency-relationship", "emergency-phone", "coverage", "coverage-provider", "blood-group", "allergy-status", "allergy-details", "conditions", "bp-systolic", "bp-diastolic", "pulse", "department", "symptoms", "priority"] as const;

export function validatePatient(form: FormData, options: { legacyDepartment?: string } = {}) {
  const data: Record<string, string> = {};
  for (const field of [...fields, ...patientOtherFields.map(key => `${key}-other`)]) {
    const value = form.get(field);
    if (value !== null && typeof value !== "string") return { error: "รูปแบบข้อมูลไม่ถูกต้อง" };
    data[field] = (value || "").trim();
    const limit = field.endsWith("-other") ? 500 : ["symptoms", "allergy-details", "conditions"].includes(field) ? 2000 : 254;
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
  if ((!departments.some(item => item.code === data.department) && (!options.legacyDepartment || options.legacyDepartment !== data.department)) || !["normal", "urgent"].includes(data.priority)) return { error: "กรุณาเลือกแผนกและระดับความเร่งด่วนให้ถูกต้อง" };
  for (const key of ["registered-postal-code", "current-postal-code"]) {
    if (data[key] && !/^\d{5}$/.test(data[key])) return { error: "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก" };
  }
  for (const key of ["bp-systolic", "bp-diastolic", "pulse"]) {
    if (data[key] && !/^[1-9][0-9]{0,2}$/.test(data[key])) return { error: "ความดันและชีพจรต้องเป็นจำนวนเต็มตั้งแต่ 1–999 หรือเว้นว่างหากยังไม่ได้วัด" };
  }
  if (Boolean(data["bp-systolic"]) !== Boolean(data["bp-diastolic"])) return { error: "กรุณากรอกความดันตัวบนและตัวล่างให้ครบทั้งสองค่า" };
  if (!data["service-type"]) data["service-type"] = "walk-in";
  if (!["walk-in", "course"].includes(data["service-type"])) return { error: "กรุณาเลือกประเภทบริการ Walk-in หรือซื้อคอร์ส" };
  if (data["course-id"] && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data["course-id"])) return { error: "คอร์สไม่ถูกต้อง" };
  if (data["service-type"] === "walk-in") data["course-id"] = "";
  for (const key of patientOtherFields) {
    if (data[key].includes("อื่น") && !data[`${key}-other`]) return { error: "กรุณากรอกหมายเหตุสำหรับตัวเลือกอื่น ๆ ให้ครบ" };
    if (!data[key].includes("อื่น")) data[`${key}-other`] = "";
  }
  return { data };
}
