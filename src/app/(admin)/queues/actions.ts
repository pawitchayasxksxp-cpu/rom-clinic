"use server";
import {requireAdmin} from '@/lib/session';
import {getDatabase} from '@/lib/db';
import {sendToExamination} from '@/lib/examinations';
import {uuidPattern} from '@/lib/course-validation';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
export async function sendPatientToRoom(id:string):Promise<{error:string}>{
 await requireAdmin();const result=await sendToExamination(id);if(!result.id)return {error:result.error||'ส่งห้องตรวจไม่สำเร็จ'};
 revalidatePath('/queues');redirect(`/queues/${result.id}`);
}
export async function changeExaminationState(_state:{error:string},form:FormData):Promise<{error:string}>{
 await requireAdmin();const id=form.get('examination-id'),status=form.get('status');
 if(typeof id!=='string'||!uuidPattern.test(id)||!['examining','cancelled'].includes(String(status)))return {error:'ข้อมูลไม่ถูกต้อง'};
 try{
  const changed=await getDatabase().query("UPDATE rom_examination q SET status=$2,started_at=CASE WHEN $2='examining' THEN COALESCE(started_at,now()) ELSE started_at END,finished_at=CASE WHEN $2='cancelled' THEN now() ELSE NULL END WHERE q.id=$1 AND q.status IN ('waiting','examining') AND EXISTS(SELECT 1 FROM rom_patient p WHERE p.id=q.patient_id AND p.deleted_at IS NULL) RETURNING id",[id,status]);
  if(!changed.rowCount)return {error:'คิวนี้จบแล้วหรือไม่พบผู้ป่วย กรุณาโหลดหน้าใหม่'};
 }catch{return {error:'เปลี่ยนสถานะไม่สำเร็จ'};}
 revalidatePath('/queues');revalidatePath(`/queues/${id}`);redirect(status==='cancelled'?'/queues':`/queues/${id}`);
}
