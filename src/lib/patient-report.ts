import "server-only";
import {requireAdmin} from './session';
import {getDatabase} from './db';
import {getPatient} from './patients';
export type ReportRecord={id:string;date:string;iso_date:string;department:string;details:Record<string,string>};
export async function patientReport(id:string,treatmentId?:string){
 await requireAdmin();const patient=await getPatient(id);if(!patient)return null;
 const client=await getDatabase().connect();try{
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const treatment=(await client.query<ReportRecord>("SELECT id,to_char(visit_at AT TIME ZONE 'Asia/Bangkok','DD/MM/YYYY HH24:MI') AS date,to_char(visit_at AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD') AS iso_date,department,details FROM rom_treatment WHERE patient_id=$1 AND ($2::uuid IS NULL OR id=$2) ORDER BY visit_at DESC,created_at DESC,id DESC LIMIT 1",[id,treatmentId||null])).rows[0]||null;
  if(treatmentId&&!treatment){await client.query('COMMIT');return null;}
  // Dates are explicit: medicines share the visit day, not an inferred prescription link.
  const medications=(await client.query<{id:string;date:string;name:string;details:Record<string,string>}>("SELECT id,to_char(created_at AT TIME ZONE 'Asia/Bangkok','DD/MM/YYYY HH24:MI') AS date,drug_name AS name,details FROM rom_dispensing WHERE patient_id=$1 AND (created_at AT TIME ZONE 'Asia/Bangkok')::date=COALESCE($2::date,(SELECT max((created_at AT TIME ZONE 'Asia/Bangkok')::date) FROM rom_dispensing WHERE patient_id=$1)) ORDER BY created_at,id",[id,treatment?.iso_date||null])).rows;
  await client.query('COMMIT');return {patient,treatment,medications};
 }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
export type PatientClinicalReport=NonNullable<Awaited<ReturnType<typeof patientReport>>>;
