import {loadEnvConfig} from '@next/env';
import {chromium,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
loadEnvConfig(process.cwd(),true);
async function main(){
 const {getDatabase,closeDatabase}=await import('../src/lib/db');const db=getDatabase();const id=randomUUID();let patient='';const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
 const actor=(await db.query("SELECT id FROM rom_auth_user WHERE role='admin' LIMIT 1")).rows[0].id;
 patient=(await db.query("INSERT INTO rom_patient(hn,first_name,last_name,birth_date,phone,department,registration_key) VALUES($1,'chart','test','2000-01-01','0812345678','GN',$2) RETURNING id::text",[`TEST-${Date.now()}`,randomUUID()])).rows[0].id;
 await db.query("INSERT INTO rom_body_chart(id,patient_id,chart_date,points,note,provider,created_by) VALUES($1,$2,CURRENT_DATE,$3::jsonb,'old note','old provider',$4)",[id,patient,JSON.stringify([{x:100,y:200,note:'old point'}]),actor]);
 const page=await browser.newPage();await page.goto('http://localhost:3000/login');await page.getByLabel('อีเมลผู้ดูแลระบบ').fill(process.env.ADMIN_EMAIL!);await page.getByLabel('รหัสผ่าน',{exact:true}).fill(process.env.ADMIN_PASSWORD!);await page.getByRole('button',{name:'เข้าสู่ระบบ',exact:true}).click();await expect(page).toHaveURL(/dashboard/);
 await page.goto(`http://localhost:3000/body-charts/${id}`);await page.getByRole('link',{name:'แก้ไข Body Chart'}).click();await expect(page.locator('#body-chart-note')).toHaveValue('old note');await expect(page.getByLabel('รายละเอียดจุดที่ 1')).toHaveValue('old point');await page.getByLabel('รายละเอียดจุดที่ 1').fill('edited point');await page.locator('#body-chart-note').fill('edited note');await page.locator('#chart-provider').fill('edited provider');await page.getByRole('button',{name:'บันทึก Body Chart'}).click();await expect(page).toHaveURL(`http://localhost:3000/body-charts/${id}`);await page.reload();await expect(page.locator('.saved-body-chart')).toContainText('edited point');await expect(page.locator('.saved-body-chart')).toContainText('edited note');await expect(page.locator('.saved-body-chart')).toContainText('edited provider');console.log('PASS: Body Chart edit prefills and persists original record');
 }finally{await browser.close();await db.query('DELETE FROM rom_body_chart WHERE id=$1',[id]);if(patient)await db.query('DELETE FROM rom_patient WHERE id=$1',[patient]);await closeDatabase();}
}void main().catch((error)=>{console.error(error instanceof Error ? error.message : 'Body Chart edit test failed');process.exitCode=1;});
