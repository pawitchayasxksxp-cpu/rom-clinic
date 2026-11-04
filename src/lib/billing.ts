import "server-only";
import { requireAdmin } from "./session";
import { getDatabase } from "./db";
import { uuidPattern } from "./course-validation";
import type { Charge } from "./billing-validation";
export type PurchasedCourse={id:string;name:string;total_sessions:number;remaining:number;expires_on:string|null;expired:boolean;date:string;payment_id:string};
export type PendingMedication={id:string;patient_id:string;name:string;quantity:string;price:string;date:string};
export type Receipt={id:string;number:string;patient_id:string;patient_name:string;hn:string;items:Charge[];subtotal:string;discount:string;total:string;received:string;change:string;method:string;reference:string;note:string;cashier:string;date:string};
export async function purchasedCourses(patientId:string):Promise<PurchasedCourse[]>{
 await requireAdmin();return (await getDatabase().query<PurchasedCourse>("SELECT id,name,total_sessions,remaining,to_char(expires_on,'YYYY-MM-DD') AS expires_on,COALESCE(expires_on < (now() AT TIME ZONE 'Asia/Bangkok')::date,false) AS expired,to_char(created_at AT TIME ZONE 'Asia/Bangkok','DD/MM/YYYY') AS date,payment_id FROM rom_patient_course WHERE patient_id=$1 ORDER BY created_at DESC,id",[patientId])).rows;
}
export async function pendingMedications(patientId?:string){
 await requireAdmin();return (await getDatabase().query<PendingMedication>("SELECT d.id,d.patient_id::text,d.drug_name AS name,d.details->>'quantity' AS quantity,COALESCE(d.details->>'unit-price',m.price::text) AS price,to_char(d.created_at AT TIME ZONE 'Asia/Bangkok','DD/MM/YYYY HH24:MI') AS date FROM rom_dispensing d JOIN rom_patient p ON p.id=d.patient_id LEFT JOIN rom_medicine m ON m.id=d.medicine_id WHERE p.deleted_at IS NULL AND ($1::bigint IS NULL OR d.patient_id=$1) AND NOT EXISTS(SELECT 1 FROM rom_payment_dispensing pd WHERE pd.dispensing_id=d.id) AND COALESCE(d.details->>'unit-price',m.price::text) IS NOT NULL ORDER BY d.created_at DESC LIMIT 200",[patientId||null])).rows;
}
export async function getReceipt(id:string):Promise<Receipt|null>{
 await requireAdmin();if(!uuidPattern.test(id))return null;
 return (await getDatabase().query<Receipt>("SELECT id,'RC-'||lpad(number::text,greatest(6,length(number::text)),'0') AS number,patient_id::text,patient_name,hn,items,subtotal::text,discount::text,total::text,received::text,change::text,method,reference,note,cashier,to_char(created_at AT TIME ZONE 'Asia/Bangkok','DD/MM/YYYY HH24:MI') AS date FROM rom_payment WHERE id=$1",[id])).rows[0]||null;
}
export async function dailyPayments(date:string){
 await requireAdmin();const db=getDatabase();
 const totals=(await db.query<{cash:string;transfer:string;total:string;discount:string;count:number}>("SELECT COALESCE(sum(total) FILTER(WHERE method='cash'),0)::text AS cash,COALESCE(sum(total) FILTER(WHERE method='transfer'),0)::text AS transfer,COALESCE(sum(total),0)::text AS total,COALESCE(sum(discount),0)::text AS discount,count(*)::int AS count FROM rom_payment WHERE created_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Bangkok') AND created_at < (($1::date+1)::timestamp AT TIME ZONE 'Asia/Bangkok')",[date])).rows[0];
 const receipts=(await db.query<{id:string;number:string;patient_name:string;hn:string;method:string;total:string;time:string}>("SELECT id,'RC-'||lpad(number::text,greatest(6,length(number::text)),'0') AS number,patient_name,hn,method,total::text,to_char(created_at AT TIME ZONE 'Asia/Bangkok','HH24:MI') AS time FROM rom_payment WHERE created_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Bangkok') AND created_at < (($1::date+1)::timestamp AT TIME ZONE 'Asia/Bangkok') ORDER BY created_at DESC LIMIT 200",[date])).rows;
 return {totals,receipts};
}
export async function patientCourseHistory(patientId:string){
 await requireAdmin();const db=getDatabase();
 const treatments=(await db.query<{id:string;date:string}>("SELECT t.id,to_char(t.visit_at AT TIME ZONE 'Asia/Bangkok','DD/MM/YYYY HH24:MI') AS date FROM rom_treatment t WHERE t.patient_id=$1 AND NOT EXISTS(SELECT 1 FROM rom_course_usage u WHERE u.treatment_id=t.id) ORDER BY t.visit_at DESC LIMIT 100",[patientId])).rows;
 const usage=(await db.query<{id:string;name:string;date:string;visit_date:string;provider:string}>("SELECT u.id,c.name,to_char(u.created_at AT TIME ZONE 'Asia/Bangkok','DD/MM/YYYY HH24:MI') AS date,to_char(t.visit_at AT TIME ZONE 'Asia/Bangkok','DD/MM/YYYY HH24:MI') AS visit_date,t.details->>'provider' AS provider FROM rom_course_usage u JOIN rom_patient_course c ON c.id=u.patient_course_id JOIN rom_treatment t ON t.id=u.treatment_id WHERE c.patient_id=$1 ORDER BY u.created_at DESC LIMIT 20",[patientId])).rows;
 return {treatments,usage};
}
