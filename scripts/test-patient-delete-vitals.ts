import {loadEnvConfig} from '@next/env';
import {chromium,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
loadEnvConfig(process.cwd(),true);
async function main(){
 const {getDatabase,closeDatabase}=await import('../src/lib/db');const {bangkokToday}=await import('../src/lib/calendar');const db=getDatabase();let patient='';const hn=`TEST-${Date.now()}`;
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
 patient=(await db.query("INSERT INTO rom_patient(hn,first_name,last_name,birth_date,phone,department,registration_key,details) VALUES($1,'vitals','test','2000-01-01','0812345678','GN',$2,$3::jsonb) RETURNING id::text",[hn,randomUUID(),JSON.stringify({'bp-systolic':'110','bp-diastolic':'70',pulse:'65'})])).rows[0].id;
 const page=await browser.newPage();await page.goto('http://localhost:3000/login');await page.getByLabel('อีเมลผู้ดูแลระบบ').fill(process.env.ADMIN_EMAIL!);await page.getByLabel('รหัสผ่าน',{exact:true}).fill(process.env.ADMIN_PASSWORD!);await page.getByRole('button',{name:'เข้าสู่ระบบ',exact:true}).click();await expect(page).toHaveURL(/dashboard/);
 for(const [time,systolic,diastolic,pulse] of [['00:00','120','80','72'],['00:01','130','85','78']]){
  await page.goto(`http://localhost:3000/registration/${patient}`);
  await page.getByRole('link',{name:'บันทึกความดัน / ชีพจรครั้งใหม่',exact:true}).click();
  await expect(page.locator('#bp-systolic')).toHaveValue('');await expect(page.locator('#pulse')).toHaveValue('');
  await page.locator('#visit-date').fill(bangkokToday());await page.locator('#visit-time').fill(time);await page.locator('#department').selectOption('GN');await page.locator('#bp-systolic').fill(systolic);await page.locator('#bp-diastolic').fill(diastolic);await page.locator('#pulse').fill(pulse);await page.locator('#symptoms').fill('test visit');await page.locator('#treatment').fill('test record');await page.getByRole('button',{name:'บันทึกประวัติการรักษา',exact:true}).click();await expect(page).toHaveURL(/treatment-saved=1/);
 }
 await page.reload();const history=page.getByRole('region',{name:'ประวัติการรักษา',exact:true});await expect(history).toContainText('120/80');await expect(history).toContainText('130/85');await expect(history).toContainText('72 ครั้ง/นาที');await expect(history).toContainText('78 ครั้ง/นาที');
 const original=(await db.query('SELECT details FROM rom_patient WHERE id=$1',[patient])).rows[0].details;assert.equal(original['bp-systolic'],'110');assert.equal(original.pulse,'65');
 await page.goto(`http://localhost:3000/registration/${patient}?q=${hn}&page=2`);const back=page.locator('.patient-detail-back').getByRole('link',{name:'กลับรายชื่อผู้ป่วย'});await expect(back).toHaveAttribute('href',`/registration?q=${hn}&page=2`);assert((await back.boundingBox())!.y < (await page.getByRole('heading',{name:'รายละเอียดผู้ป่วย',exact:true}).boundingBox())!.y);
 page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:`ลบผู้ป่วย ${hn}`,exact:true}).click();assert.equal((await db.query('SELECT deleted_at FROM rom_patient WHERE id=$1',[patient])).rows[0].deleted_at,null);
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:`ลบผู้ป่วย ${hn}`,exact:true}).click();await expect(page).toHaveURL(/registration\?deleted=1/);await expect(page.locator('.form-feedback[role="status"]')).toContainText('ลบผู้ป่วย');
 assert((await db.query('SELECT deleted_at,deleted_by FROM rom_patient WHERE id=$1',[patient])).rows[0].deleted_at);assert.equal((await db.query('SELECT count(*)::int AS count FROM rom_treatment WHERE patient_id=$1',[patient])).rows[0].count,2);
 await page.goto(`http://localhost:3000/registration?q=${hn}`);await expect(page.getByRole('cell',{name:hn,exact:true})).toHaveCount(0);
 const choices=await page.request.get(`http://localhost:3000/api/patients/search?q=${hn}`);assert(!JSON.stringify(await choices.json()).includes(hn));
 console.log('PASS: repeat visit vitals stay separate, registration values retained, top-left back link, cancel/confirm deletion, hidden patient and preserved history');
 }finally{await browser.close();if(patient){await db.query('DELETE FROM rom_treatment WHERE patient_id=$1',[patient]);await db.query('DELETE FROM rom_patient WHERE id=$1',[patient]);}await closeDatabase();}
}void main().catch(error=>{console.error(error instanceof Error?error.message:'Patient test failed');process.exitCode=1;});
