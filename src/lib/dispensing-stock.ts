import "server-only";
import { getDatabase } from "./db";
import { validateDispensing } from "./dispensing-validation";
import { uuidPattern } from "./course-validation";

// Called only with the authenticated administrator's ID; verify the role again in the transaction.
export async function recordDispensing(form: FormData, actorId: string) {
  const key = form.get("dispensing-key"), medicineId = form.get("medicine-id");
  if (typeof key !== "string" || !uuidPattern.test(key) || typeof medicineId !== "string" || !uuidPattern.test(medicineId)) throw new Error("กรุณาเลือกยาจาก Master Data");
  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN");
    const admin = await client.query("SELECT id FROM rom_auth_user WHERE id=$1 AND role='admin'", [actorId]);
    if (!admin.rowCount) throw new Error("ไม่มีสิทธิ์จ่ายยา");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [key]);
    const existing = await client.query("SELECT patient_id::text FROM rom_dispensing WHERE id=$1", [key]);
    if (existing.rowCount) { await client.query("COMMIT"); return {key, patientId: existing.rows[0].patient_id as string}; }
    const medicines = await client.query("SELECT name,dosage_form,form_other,unit,unit_other,stock::text FROM rom_medicine WHERE id=$1 AND archived_at IS NULL FOR UPDATE", [medicineId]);
    const medicine = medicines.rows[0];
    if (!medicine) throw new Error("ไม่พบยาในคลัง กรุณาเลือกยาอีกครั้ง");
    const canonical = new FormData();
    for (const [name, value] of form.entries()) canonical.set(name, value);
    for (const [name, value] of Object.entries({"drug-name": medicine.name, strength: medicine.dosage_form, "strength-other": medicine.form_other, unit: medicine.unit, "unit-other": medicine.unit_other})) canonical.set(name, value as string);
    const result = validateDispensing(canonical);
    if (!result.data) throw new Error(result.error);
    const stock = await client.query("UPDATE rom_medicine SET stock=stock-$2::numeric,updated_at=now() WHERE id=$1 AND stock >= $2::numeric RETURNING id", [medicineId, result.data.quantity]);
    if (!stock.rowCount) throw new Error(`สต๊อกยาไม่เพียงพอ คงเหลือ ${medicine.stock} ${medicine.unit === "อื่น ๆ" ? medicine.unit_other : medicine.unit}`);
    const saved = await client.query(`INSERT INTO rom_dispensing (id,patient_id,patient_name,hn,drug_name,details,created_by,medicine_id)
      SELECT $1::uuid,id,concat_ws(' ',first_name,last_name),COALESCE(hn,'ROM-'||lpad(id::text,8,'0')),$3,$4::jsonb,$5,$6::uuid
      FROM rom_patient WHERE deleted_at IS NULL AND COALESCE(hn,'ROM-'||lpad(id::text,8,'0'))=$2 RETURNING patient_id::text`, [key,result.hn,medicine.name,JSON.stringify(result.data),actorId,medicineId]);
    if (!saved.rowCount) throw new Error("ไม่พบผู้ป่วย กรุณาเลือกจากรายชื่ออีกครั้ง");
    await client.query("COMMIT");
    return {key,patientId:saved.rows[0].patient_id as string};
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
