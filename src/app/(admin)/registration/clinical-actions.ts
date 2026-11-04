"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { patientFieldDisplay } from "@/lib/patient-field-display";
import { getPatient } from "@/lib/patients";
import { getDatabase } from "@/lib/db";
import { validateCertificate, validateTreatment } from "@/lib/clinical-validation";

export async function saveTreatment(_state: { error: string }, form: FormData): Promise<{ error: string }> {
  const user = await requireAdmin();
  const result = validateTreatment(form);
  if (!result.data) return { error: result.error! };
  if (!await getPatient(result.patientId)) return { error: "ไม่พบผู้ป่วย" };
  try {
    await getDatabase().query(
      `INSERT INTO rom_treatment (id, patient_id, visit_at, department, details, created_by)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6) ON CONFLICT (id) DO NOTHING`,
      [result.key, result.patientId, `${result.data["visit-date"]}T${result.data["visit-time"]}:00+07:00`, result.data.department, JSON.stringify(result.data), user.id],
    );
  } catch { return { error: "บันทึกประวัติการรักษาไม่สำเร็จ กรุณาลองอีกครั้ง" }; }
  revalidatePath(`/registration/${result.patientId}`);
  redirect(`/registration/${result.patientId}?treatment-saved=1#treatment-history`);
}

export async function saveCertificate(_state: { error: string }, form: FormData): Promise<{ error: string }> {
  const user = await requireAdmin();
  const result = validateCertificate(form);
  if (!result.data) return { error: result.error! };
  const patient = await getPatient(result.patientId);
  if (!patient) return { error: "ไม่พบผู้ป่วย" };
  const detail = (key: string) => patientFieldDisplay(patient.details, key);
  const snapshot = { name: `${detail("title")} ${patient.first_name} ${patient.last_name}`.trim(), hn: patient.hn,
    birthDate: patient.birth_date, identity: detail("identity-number"),
    address: ["registered-line", "registered-subdistrict", "registered-district", "registered-province", "registered-postal-code"].map(detail).filter(Boolean).join(" ") };
  try {
    await getDatabase().query(
      `INSERT INTO rom_certificate (id, patient_id, patient_snapshot, issue_date, details, created_by)
       VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, $6) ON CONFLICT (id) DO NOTHING`,
      [result.key, result.patientId, JSON.stringify(snapshot), result.data["issue-date"], JSON.stringify(result.data), user.id],
    );
  } catch { return { error: "บันทึกใบรับรองแพทย์ไม่สำเร็จ กรุณาลองอีกครั้ง" }; }
  revalidatePath(`/registration/${result.patientId}`);
  redirect(`/certificates/${result.key}`);
}
