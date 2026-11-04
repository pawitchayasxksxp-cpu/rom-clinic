import "server-only";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { getDatabase } from "./db";
import { validatePayment, type Charge } from "./billing-validation";
import { cents, decimal, lineCents } from "./money";
import { uuidPattern } from "./course-validation";
export class BillingError extends Error {}
// Authenticated actions pass actorId; internal services also verify the persisted role.
async function actor(client: PoolClient, actorId: string) {
  const result=await client.query("SELECT name FROM rom_auth_user WHERE id=$1 AND role='admin'",[actorId]);
  if(!result.rowCount)throw new BillingError("ไม่มีสิทธิ์ทำรายการ");
  return result.rows[0].name as string;
}
export async function collectPayment(form: FormData,actorId:string) {
  let input;try{input=validatePayment(form);}catch(error){throw new BillingError(error instanceof Error?error.message:"ข้อมูลไม่ถูกต้อง");}
  const client=await getDatabase().connect();
  try{
    await client.query('BEGIN');const cashier=await actor(client,actorId);
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",[`payment-${input.key}`]);
    if((await client.query('SELECT id FROM rom_payment WHERE id=$1',[input.key])).rowCount){await client.query('COMMIT');return input.key;}
    const patient=(await client.query("SELECT hn,concat_ws(' ',first_name,last_name) AS name FROM rom_patient WHERE id=$1 AND deleted_at IS NULL FOR UPDATE",[input.patientId])).rows[0];
    if(!patient)throw new BillingError("ไม่พบผู้ป่วย กรุณาเลือกใหม่");
    const items:Charge[]=[];const purchases:{id:string;name:string;price:string;total:number;validity:number|null}[]=[];
    // Consistent lock order avoids two mixed baskets locking the same sources in reverse.
    const sourceOrder=[...input.items].filter(i=>i.kind!=="service").sort((a,b)=>`${a.kind}${a.sourceId}`.localeCompare(`${b.kind}${b.sourceId}`));
    for(const item of sourceOrder){
      if(item.kind==="course")await client.query('SELECT id FROM rom_course WHERE id=$1 FOR SHARE',[item.sourceId]);
      else await client.query('SELECT id FROM rom_dispensing WHERE id=$1 FOR UPDATE',[item.sourceId]);
    }
    for(const item of input.items){
      let name=item.name,price=item.price,quantity=item.quantity;
      if(item.kind==="course"){
        const course=(await client.query('SELECT name,price::text,total_sessions,validity_days FROM rom_course WHERE id=$1 AND archived_at IS NULL',[item.sourceId])).rows[0];
        if(!course)throw new BillingError("คอร์สถูกลบแล้ว กรุณาเลือกใหม่");
        if(item.sessions!==course.total_sessions||item.validityDays!==course.validity_days)throw new BillingError("จำนวนครั้งหรืออายุคอร์สเปลี่ยนแปลง กรุณาโหลดหน้าและตรวจสอบใหม่");
        name=course.name;price=course.price;quantity="1";
        purchases.push({id:item.sourceId,name,price,total:course.total_sessions,validity:course.validity_days});
        name=`${course.name} (${course.total_sessions} ครั้ง)`;
      }else if(item.kind==="dispensing"){
        const medication=(await client.query("SELECT d.drug_name,d.details->>'quantity' AS quantity,COALESCE(d.details->>'unit-price',m.price::text) AS price FROM rom_dispensing d LEFT JOIN rom_medicine m ON m.id=d.medicine_id WHERE d.id=$1 AND d.patient_id=$2 AND NOT EXISTS(SELECT 1 FROM rom_payment_dispensing pd WHERE pd.dispensing_id=d.id)",[item.sourceId,input.patientId])).rows[0];
        if(!medication||medication.price===null)throw new BillingError("รายการยานี้ชำระแล้ว หรือไม่พบราคายาจากคลัง");
        name=medication.drug_name;price=medication.price;quantity=medication.quantity;
      }
      if(cents(item.price)!==cents(price)||cents(item.quantity)!==cents(quantity))throw new BillingError("ราคาหรือจำนวนเปลี่ยนแปลง กรุณาโหลดหน้าและตรวจยอดใหม่");
      items.push({...item,name,price,quantity,amount:decimal(lineCents(price,quantity))});
    }
    const subtotal=items.reduce((sum,item)=>sum+cents(item.amount),0),total=subtotal-input.discount;
    await client.query(`INSERT INTO rom_payment(id,patient_id,patient_name,hn,items,subtotal,discount,total,received,change,method,reference,note,cashier,created_by)
      VALUES($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,[input.key,input.patientId,patient.name,patient.hn,JSON.stringify(items),decimal(subtotal),decimal(input.discount),decimal(total),decimal(input.received),decimal(input.received-total),input.method,input.reference,input.note,cashier,actorId]);
    for(const item of items.filter(i=>i.kind==="dispensing"))await client.query('INSERT INTO rom_payment_dispensing(dispensing_id,payment_id) VALUES($1,$2)',[item.sourceId,input.key]);
    for(const course of purchases){
      await client.query(`INSERT INTO rom_patient_course(id,patient_id,course_id,payment_id,name,price,total_sessions,remaining,expires_on)
        VALUES($1,$2,$3,$4,$5,$6,$7,$7,CASE WHEN $8::int IS NULL THEN NULL ELSE (now() AT TIME ZONE 'Asia/Bangkok')::date+$8::int END)`,[randomUUID(),input.patientId,course.id,input.key,course.name,course.price,course.total,course.validity]);
    }
    if(purchases.length)await client.query("UPDATE rom_patient SET course_id=$2,details=jsonb_set(details,'{service-type}','\"course\"'::jsonb,true) WHERE id=$1",[input.patientId,purchases[0].id]);
    await client.query('COMMIT');return input.key;
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
export async function redeemCourse(client:PoolClient,entitlementId:string,treatmentId:string,patientId:string,key:string,actorId:string){
  if(![entitlementId,treatmentId,key].every(id=>uuidPattern.test(id)))throw new BillingError("ข้อมูลคอร์สไม่ถูกต้อง");
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",[`course-usage-${key}`]);
  const existing=await client.query('SELECT patient_course_id,treatment_id FROM rom_course_usage WHERE id=$1',[key]);
  if(existing.rowCount){if(existing.rows[0].patient_course_id!==entitlementId||existing.rows[0].treatment_id!==treatmentId)throw new BillingError("รหัสรายการซ้ำ กรุณาโหลดหน้าใหม่");return;}
  const course=(await client.query("SELECT remaining,expires_on IS NOT NULL AND expires_on < (now() AT TIME ZONE 'Asia/Bangkok')::date AS expired FROM rom_patient_course WHERE id=$1 AND patient_id=$2 FOR UPDATE",[entitlementId,patientId])).rows[0];
  if(!course)throw new BillingError("ไม่พบคอร์สของผู้ป่วยนี้");
  if(course.expired)throw new BillingError("คอร์สหมดอายุแล้ว");
  if(course.remaining<=0)throw new BillingError("คอร์สใช้ครบแล้ว");
  const treatment=await client.query('SELECT id FROM rom_treatment WHERE id=$1 AND patient_id=$2 FOR SHARE',[treatmentId,patientId]);
  if(!treatment.rowCount)throw new BillingError("ไม่พบการรักษาของผู้ป่วยนี้");
  if((await client.query('SELECT id FROM rom_course_usage WHERE treatment_id=$1',[treatmentId])).rowCount)throw new BillingError("การรักษาครั้งนี้ตัดคอร์สแล้ว");
  await client.query('INSERT INTO rom_course_usage(id,patient_course_id,treatment_id,created_by) VALUES($1,$2,$3,$4)',[key,entitlementId,treatmentId,actorId]);
  await client.query('UPDATE rom_patient_course SET remaining=remaining-1 WHERE id=$1',[entitlementId]);
}
export async function recordCourseSession(entitlementId:string,treatmentId:string,patientId:string,key:string,actorId:string){
  if(!/^[1-9]\d{0,18}$/.test(patientId)||BigInt(patientId)>BigInt("9223372036854775807"))throw new BillingError("ผู้ป่วยไม่ถูกต้อง");
  const client=await getDatabase().connect();try{
    await client.query('BEGIN');await actor(client,actorId);
    if(!(await client.query('SELECT id FROM rom_patient WHERE id=$1 AND deleted_at IS NULL FOR SHARE',[patientId])).rowCount)throw new BillingError("ไม่พบผู้ป่วย");
    await redeemCourse(client,entitlementId,treatmentId,patientId,key,actorId);await client.query('COMMIT');
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
