import { bangkokToday, isCalendarDate } from "./calendar";
import { departments } from "./navigation";

export const treatmentFields = ["visit-date", "visit-time", "department", "symptoms", "examination", "assessment", "treatment", "provider", "follow-up", "bp-systolic", "bp-diastolic", "pulse"] as const;
export const certificateFields = ["issue-date", "exam-date", "facility", "facility-address", "examination", "opinion", "rest-from", "rest-until", "provider", "profession", "license"] as const;

function readFields(form: FormData, fields: readonly string[]) {
  const data: Record<string, string> = {};
  for (const field of fields) {
    const value = form.get(field);
    if (typeof value !== "string") return null;
    data[field] = value.trim();
    const limit = ["symptoms", "examination", "assessment", "treatment", "opinion", "facility-address"].includes(field) ? 4000 : 254;
    if (data[field].length > limit) return null;
  }
  return data;
}

export function clinicalIdentity(form: FormData) {
  const patientId = form.get("patient-id");
  const key = form.get("record-key");
  if (typeof patientId !== "string" || !/^[1-9]\d{0,18}$/.test(patientId) || BigInt(patientId) > BigInt("9223372036854775807")) return null;
  if (typeof key !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) return null;
  return { patientId, key };
}

type ClinicalResult = { error: string; data?: undefined; patientId?: undefined; key?: undefined } | { error?: undefined; data: Record<string, string>; patientId: string; key: string };

export function validateTreatment(form: FormData): ClinicalResult {
  const identity = clinicalIdentity(form);
  const data = readFields(form, treatmentFields);
  if (!identity || !data) return { error: "ข้อมูลไม่ถูกต้องหรือข้อความยาวเกินกำหนด" };
  if (!isCalendarDate(data["visit-date"]) || data["visit-date"] > bangkokToday() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(data["visit-time"])) return { error: "กรุณาระบุวันที่และเวลารับบริการให้ถูกต้อง ไม่เกินวันนี้" };
  if (new Date(`${data["visit-date"]}T${data["visit-time"]}:00+07:00`).getTime() > Date.now()) return { error: "เวลารับบริการต้องไม่เป็นเวลาในอนาคต" };
  if (!departments.some(item => item.code === data.department)) return { error: "กรุณาเลือกแผนก" };
  if (!data.symptoms || !data.treatment || !data.provider) return { error: "กรุณากรอกอาการ การรักษา และผู้ให้บริการ" };
  if (data["follow-up"] && (!isCalendarDate(data["follow-up"]) || data["follow-up"] < data["visit-date"])) return { error: "วันติดตามอาการต้องไม่ก่อนวันที่รับบริการ" };
  for (const key of ["bp-systolic", "bp-diastolic", "pulse"]) if (data[key] && !/^[1-9][0-9]{0,2}$/.test(data[key])) return { error: "ความดันและชีพจรต้องเป็นจำนวนเต็ม 1–999 หรือเว้นว่าง" };
  if (Boolean(data["bp-systolic"]) !== Boolean(data["bp-diastolic"])) return { error: "กรุณากรอกความดันตัวบนและตัวล่างให้ครบ" };
  return { data, ...identity };
}

export function validateCertificate(form: FormData): ClinicalResult {
  const identity = clinicalIdentity(form);
  const data = readFields(form, certificateFields);
  if (!identity || !data) return { error: "ข้อมูลไม่ถูกต้องหรือข้อความยาวเกินกำหนด" };
  if (!isCalendarDate(data["issue-date"]) || !isCalendarDate(data["exam-date"]) || data["issue-date"] > bangkokToday() || data["exam-date"] > data["issue-date"]) return { error: "วันที่ตรวจต้องไม่หลังวันที่ออกเอกสาร และวันที่ออกเอกสารต้องไม่เกินวันนี้" };
  if (!data.facility || !data.examination || !data.opinion || !data.provider || !data.license) return { error: "กรุณากรอกสถานที่ ผลตรวจ ความเห็น ชื่อผู้รับรอง และเลขใบอนุญาตให้ครบ" };
  if (Boolean(data["rest-from"]) !== Boolean(data["rest-until"])) return { error: "กรุณาระบุวันเริ่มและวันสิ้นสุดการพักให้ครบ หรือเว้นว่างทั้งสองช่อง" };
  if (data["rest-from"] && (!isCalendarDate(data["rest-from"]) || !isCalendarDate(data["rest-until"]) || data["rest-until"] < data["rest-from"])) return { error: "ช่วงวันที่พักไม่ถูกต้อง" };
  return { data, ...identity };
}
