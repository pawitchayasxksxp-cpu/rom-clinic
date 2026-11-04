import { getAdminSession } from "@/lib/session";
import { getPatient } from "@/lib/patients";
import { pendingMedications } from "@/lib/billing";
export async function GET(request:Request){
 const headers={'Cache-Control':'private, no-store'};
 if(!await getAdminSession())return Response.json({error:'กรุณาเข้าสู่ระบบ'},{status:401,headers});
 const id=new URL(request.url).searchParams.get('patient')||'';
 if(!await getPatient(id))return Response.json({error:'ไม่พบผู้ป่วย'},{status:404,headers});
 try{return Response.json(await pendingMedications(id),{headers});}catch{return Response.json({error:'โหลดรายการยาไม่สำเร็จ'},{status:500,headers});}
}
