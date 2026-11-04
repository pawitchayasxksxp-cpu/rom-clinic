import { loadEnvConfig } from "@next/env";
import { chromium, expect } from "@playwright/test";
import ExcelJS from "exceljs";
import { writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { bangkokToday } from "../src/lib/calendar";
loadEnvConfig(process.cwd(),true);
async function main(){
 const{getDatabase,closeDatabase}=await import("../src/lib/db");const browser=await chromium.launch({channel:"chrome",headless:true});const page=await browser.newPage();const hn=`TEST-${Date.now()}`;let patientId="";const certId=randomUUID(),chartId=randomUUID(),labelId=randomUUID();
 try{
 const actor=(await getDatabase().query("SELECT id FROM rom_auth_user WHERE email=$1",[process.env.ADMIN_EMAIL])).rows[0].id;
 patientId=(await getDatabase().query("INSERT INTO rom_patient(hn,first_name,last_name,birth_date,phone,department,registration_key) VALUES($1,'ทดสอบเอกสาร','ข้อมูลจำลอง','2000-01-01','0812345678','GN',$2) RETURNING id::text",[hn,randomUUID()])).rows[0].id;
 const details={"issue-date":bangkokToday(),"exam-date":bangkokToday(),facility:"ROM Clinic","facility-address":"ที่อยู่ทดสอบสำหรับตรวจเอกสาร",examination:"ผลการตรวจจำลองสำหรับทดสอบระบบ",opinion:"ความเห็นจำลองสำหรับทดสอบระบบ","rest-from":"","rest-until":"",provider:"ผู้ตรวจทดสอบ",profession:"วิชาชีพทดสอบ",license:"TEST-LICENSE"};
 await getDatabase().query("INSERT INTO rom_certificate(id,patient_id,patient_snapshot,issue_date,details,created_by) VALUES($1,$2,$3::jsonb,$4,$5::jsonb,$6)",[certId,patientId,JSON.stringify({name:"ทดสอบเอกสาร ข้อมูลจำลอง",hn,birthDate:"2000-01-01",identity:"",address:"ที่อยู่จำลอง"}),bangkokToday(),JSON.stringify(details),actor]);
 await getDatabase().query("INSERT INTO rom_body_chart(id,patient_id,chart_date,points,note,provider,created_by) VALUES($1,$2,$3,$4::jsonb,'บันทึก Body Chart ทดสอบ','ผู้บันทึกทดสอบ',$5)",[chartId,patientId,bangkokToday(),JSON.stringify([{x:250,y:190,note:"จุดทดสอบด้านหลัง"},{x:670,y:390,note:"จุดทดสอบด้านหน้า"}]),actor]);
 await getDatabase().query("INSERT INTO rom_dispensing(id,patient_id,patient_name,hn,drug_name,details,created_by) VALUES($1,$2,'ทดสอบเอกสาร ข้อมูลจำลอง',$3,'ยาทดสอบไฟล์',$4::jsonb,$5)",[labelId,patientId,hn,JSON.stringify({"drug-name":"ยาทดสอบไฟล์",strength:"ยาเม็ด",quantity:"1",unit:"เม็ด",directions:"ข้อความทดสอบ",dispenser:"ผู้ทดสอบ"}),actor]);
 await page.goto("http://localhost:3000/login");await page.getByLabel("อีเมลผู้ดูแลระบบ").fill(process.env.ADMIN_EMAIL!);await page.getByLabel("รหัสผ่าน",{exact:true}).fill(process.env.ADMIN_PASSWORD!);await page.getByRole("button",{name:"เข้าสู่ระบบ",exact:true}).click();await expect(page).toHaveURL(/\/dashboard$/);
 for(const[name,path,selector]of[["certificate",`/certificates/${certId}`,".medical-certificate"],["body-chart",`/body-charts/${chartId}`,".saved-body-chart"],["calendar","/calendar?date=2099-12-01",".calendar-full"]]){
 await page.goto(`http://localhost:3000${path}`);await expect(page.locator(selector)).toBeVisible();await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(Array.from(document.images).map(image=>image.decode().catch(()=>{})));if(document.querySelector("svg image"))await new Promise<void>(resolve=>{const image=new Image();image.onload=()=>resolve();image.onerror=()=>resolve();image.src="/body-chart.png";});});await page.emulateMedia({media:"print"});await page.pdf({path:`test-results/${name}.pdf`,preferCSSPageSize:true,printBackground:true});await page.emulateMedia({media:"screen"});
 }
 for (const resource of ["patients","bookings","waiting","dashboard","courses","medicines","admins","activity","system","patient","certificate","body-chart","label"]) {
  const id = resource === "certificate" ? certId : resource === "body-chart" ? chartId : resource === "label" ? labelId : patientId;
  const response = await page.request.get(`http://localhost:3000/api/exports?${new URLSearchParams({resource,id,q:hn,date:"2099-12-01"})}`);
  expect(response.status(), `Export ${resource}`).toBe(200);
  const bytes = await response.body(); expect(bytes.subarray(0,2).toString()).toBe("PK");
  if (resource === "patient") { const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(bytes as unknown as Parameters<typeof workbook.xlsx.load>[0]); expect(workbook.worksheets.length).toBe(5); expect(JSON.stringify(workbook.worksheets.map(sheet=>sheet.getSheetValues()))).toContain("ทดสอบเอกสาร"); await writeFile("test-results/patient-export.xlsx",bytes); }
 }
 console.log("PASS: 13 export datasets, Excel content, populated pages, Thai fonts and images before PDF creation.");
 }finally{if(patientId){await getDatabase().query("DELETE FROM rom_certificate WHERE patient_id=$1",[patientId]);await getDatabase().query("DELETE FROM rom_body_chart WHERE patient_id=$1",[patientId]);await getDatabase().query("DELETE FROM rom_dispensing WHERE patient_id=$1",[patientId]);await getDatabase().query("DELETE FROM rom_patient WHERE id=$1 AND hn=$2",[patientId,hn]);}await browser.close();await closeDatabase();}
}
void main().catch(error=>{console.error(error.message);process.exitCode=1;});
