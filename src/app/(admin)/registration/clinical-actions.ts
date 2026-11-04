"use server";
import { uuidPattern } from "@/lib/course-validation";
import { BillingError, redeemCourse } from "@/lib/billing-transactions";
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
  const queueId = form.get("examination-id");
  if (queueId !== null && (typeof queueId !== "string" || !uuidPattern.test(queueId) || queueId !== result.key)) return {error:"คิวห้องตรวจไม่ถูกต้อง"};
  if (queueId && (!result.data["illness-history"] || !result.data.examination)) return {error:"กรุณากรอกประวัติการเจ็บป่วยและการตรวจทางร่างกาย"};
  const entitlement = form.get("patient-course-id");
  if (entitlement !== null && typeof entitlement !== "string") return { error: "ข้อมูลคอร์สไม่ถูกต้อง" };
  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN");
    if (queueId) {
      const room = (await client.query("SELECT status,treatment_id FROM rom_examination WHERE id=$1 AND patient_id=$2 FOR UPDATE",[queueId,result.patientId])).rows[0];
      if (!room || room.status === "cancelled" || (room.status === "completed" && room.treatment_id !== result.key)) throw new BillingError("คิวห้องตรวจนี้ถูกยกเลิกหรือไม่ถูกต้อง");
    }
    if (!(await client.query("SELECT id FROM rom_patient WHERE id=$1 AND deleted_at IS NULL FOR SHARE", [result.patientId])).rowCount) throw new BillingError("ไม่พบผู้ป่วย");
    const saved = await client.query(
      `INSERT INTO rom_treatment (id, patient_id, visit_at, department, details, created_by)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6) ON CONFLICT (id) DO NOTHING RETURNING id`,
      [result.key, result.patientId, `${result.data["visit-date"]}T${result.data["visit-time"]}:00+07:00`, result.data.department, JSON.stringify(result.data), user.id],
    );
    if (saved.rowCount && entitlement) await redeemCourse(client, entitlement, result.key, result.patientId, result.key, user.id);
    if (queueId) await client.query("UPDATE rom_examination SET status='completed',treatment_id=$2,department=$3,started_at=COALESCE(started_at,now()),finished_at=COALESCE(finished_at,now()) WHERE id=$1",[queueId,result.key,result.data.department]);
    await client.query("COMMIT");
  } catch(error) { await client.query("ROLLBACK"); return { error: error instanceof BillingError ? error.message : "บันทึกประวัติการรักษาไม่สำเร็จ กรุณาลองอีกครั้ง" }; }
  finally { client.release(); }
  revalidatePath("/queues");
  if (queueId) revalidatePath(`/queues/${queueId}`);
  revalidatePath("/registration");
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
    birthDate: patient.birth_date, identity: detail("identity-number"), identityType: detail("identity-type"),
    address: ["registered-line", "registered-subdistrict", "registered-district", "registered-province", "registered-postal-code"].map(detail).filter(Boolean).join(" ") };
  try {
    await getDatabase().query(
      `INSERT INTO rom_certificate (id, patient_id, patient_snapshot, issue_date, details, created_by)
       VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, $6) ON CONFLICT (id) DO NOTHING`,
      [result.key, result.patientId, JSON.stringify(snapshot), result.data["issue-date"], JSON.stringify(result.data), user.id],
    );
  } catch { return { error: "บันทึกใบรับรองแพทย์ไม่สำเร็จ กรุณาลองอีกครั้ง" }; }
  revalidatePath(`/registration/${result.patientId}`);
  redirect(`/certificates/${result.key}${form.get("print-after-save") === "1" ? "?print=1" : ""}`);
}
