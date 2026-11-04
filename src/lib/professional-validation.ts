import { isCalendarDate } from "./calendar";
export const professions = ["แพทย์", "แพทย์แผนไทย", "แพทย์แผนไทยประยุกต์", "พยาบาล", "นักกายภาพบำบัด", "เภสัชกร", "อื่น ๆ"] as const;
export const professionalFields = ["license-name", "profession", "profession-other", "license-number", "license-issued", "license-expires"] as const;
export function validateProfessional(form: FormData) {
  const data: Record<string, string> = {};
  for (const key of professionalFields) { const value = form.get(key); if (value !== null && typeof value !== "string") return { error: "ข้อมูลใบประกอบวิชาชีพไม่ถูกต้อง" }; data[key] = (value || "").trim(); if (data[key].length > 254) return { error: "ข้อมูลใบประกอบวิชาชีพยาวเกินกำหนด" }; }
  if (Object.values(data).every(value => !value)) return { data: null };
  if (!data["license-name"] || !data["license-number"] || !professions.some(value => value === data.profession)) return { error: "กรุณากรอกชื่อบนใบอนุญาต วิชาชีพ และเลขใบอนุญาตให้ครบ" };
  if (data.profession === "อื่น ๆ" && !data["profession-other"]) return { error: "กรุณาระบุหมายเหตุวิชาชีพอื่น ๆ" };
  if (data.profession !== "อื่น ๆ") data["profession-other"] = "";
  for (const key of ["license-issued", "license-expires"]) if (data[key] && !isCalendarDate(data[key])) return { error: "วันที่ในใบประกอบวิชาชีพไม่ถูกต้อง" };
  if (data["license-issued"] && data["license-expires"] && data["license-expires"] < data["license-issued"]) return { error: "วันหมดอายุต้องไม่ก่อนวันที่ออกใบอนุญาต" };
  return { data };
}
