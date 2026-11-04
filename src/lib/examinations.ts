import "server-only";
import {randomUUID} from 'node:crypto';
import {requireAdmin} from './session';
import {getDatabase} from './db';
import {uuidPattern} from './course-validation';
export type Examination={id:string;patient_id:string;hn:string;name:string;department:string;status:'waiting'|'examining'|'completed'|'cancelled';number:string;date:string;treatment_id:string|null};
export const examinationStatus={waiting:'รอตรวจ',examining:'กำลังตรวจ',completed:'ตรวจเสร็จแล้ว',cancelled:'ยกเลิก'};
export async function sendToExamination(patientId:string){
 const user=await requireAdmin();if(!/^[1-9]\d{0,18}$/.test(patientId)||BigInt(patientId)>BigInt('9223372036854775807'))return {error:'ผู้ป่วยไม่ถูกต้อง'};
 const client=await getDatabase().connect();try{
  await client.query('BEGIN');const patient=(await client.query('SELECT department FROM rom_patient WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',[patientId])).rows[0];
  if(!patient){await client.query('ROLLBACK');return {error:'ไม่พบผู้ป่วย'};}
  const active=(await client.query("SELECT id FROM rom_examination WHERE patient_id=$1 AND status IN ('waiting','examining')",[patientId])).rows[0];
  const id=active?.id||randomUUID();if(!active)await client.query('INSERT INTO rom_examination(id,patient_id,department,created_by) VALUES($1,$2,$3,$4)',[id,patientId,patient.department,user.id]);
  await client.query('COMMIT');return {id:id as string};
 }catch{await client.query('ROLLBACK');return {error:'ส่งห้องตรวจไม่สำเร็จ กรุณาลองอีกครั้ง'};}finally{client.release();}
}
const select="SELECT q.id,q.patient_id::text,p.hn,concat_ws(' ',p.first_name,p.last_name) AS name,q.department,q.status,'Q-'||lpad(q.number::text,greatest(6,length(q.number::text)),'0') AS number,to_char(q.created_at AT TIME ZONE 'Asia/Bangkok','DD/MM/YYYY HH24:MI') AS date,q.treatment_id FROM rom_examination q JOIN rom_patient p ON p.id=q.patient_id";
export async function getExamination(id:string):Promise<Examination|null>{await requireAdmin();if(!uuidPattern.test(id))return null;return (await getDatabase().query<Examination>(select+' WHERE q.id=$1 AND p.deleted_at IS NULL',[id])).rows[0]||null;}
export async function listExaminations(date:string,department:string){await requireAdmin();return (await getDatabase().query<Examination>(select+" WHERE p.deleted_at IS NULL AND ($2='' OR q.department=$2) AND (q.status IN ('waiting','examining') OR (q.created_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Bangkok') AND q.created_at < (($1::date+1)::timestamp AT TIME ZONE 'Asia/Bangkok'))) ORDER BY CASE q.status WHEN 'examining' THEN 0 WHEN 'waiting' THEN 1 ELSE 2 END,q.created_at,q.id LIMIT 200",[date,department])).rows;}
