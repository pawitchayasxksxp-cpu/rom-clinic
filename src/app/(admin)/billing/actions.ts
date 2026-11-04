"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { BillingError,collectPayment,recordCourseSession } from "@/lib/billing-transactions";
export async function savePayment(_state:{error:string},form:FormData):Promise<{error:string}>{
 const user=await requireAdmin();let id;
 try{id=await collectPayment(form,user.id);}catch(error){return {error:error instanceof BillingError?error.message:"บันทึกรับเงินไม่สำเร็จ กรุณาตรวจสอบว่ารายการยาชำระแล้วหรือไม่ และลองใหม่"};}
 for(const path of ['/billing','/registration','/dispensing'])revalidatePath(path,'layout');
 redirect(`/billing/${id}`);
}
export async function usePatientCourse(_state:{error:string;message:string},form:FormData):Promise<{error:string;message:string}>{
 const user=await requireAdmin();const values=['patient-course-id','treatment-id','patient-id','usage-key'].map(key=>form.get(key));
 if(!values.every(v=>typeof v==='string'))return {error:'ข้อมูลไม่ถูกต้อง',message:''};
 const [course,treatment,patient,key]=values as string[];
 try{await recordCourseSession(course,treatment,patient,key,user.id);}catch(error){return {error:error instanceof BillingError?error.message:'ตัดคอร์สไม่สำเร็จ หรือการรักษานี้ถูกตัดคอร์สแล้ว กรุณาโหลดหน้าใหม่',message:''};}
 revalidatePath(`/registration/${patient}`);revalidatePath('/registration');
 return {error:'',message:'ตัดคอร์ส 1 ครั้งเรียบร้อยแล้ว'};
}
