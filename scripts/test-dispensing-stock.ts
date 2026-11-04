import { loadEnvConfig } from "@next/env";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
loadEnvConfig(process.cwd(), true);
async function main() {
 const {getDatabase,closeDatabase}=await import("../src/lib/db");
 const {recordDispensing}=await import("../src/lib/dispensing-stock");
 const {emptyDrugLabel}=await import("../src/lib/dispensing-validation");
 if (process.argv[2] === "worker") {
  const payload = JSON.parse(process.argv[3]); const form = new FormData();
  for (const [key,value] of Object.entries(payload.form)) form.set(key,value as string);
  try { await recordDispensing(form,payload.actor); console.log("saved"); }
  catch { console.log("rejected"); } finally {await closeDatabase();}
  return;
 }
 const db=getDatabase(), medicine=randomUUID(),hn=`TEST-${Date.now()}`;
 let patient="";
 try {
 const actor=(await db.query("SELECT id FROM rom_auth_user WHERE role='admin' LIMIT 1")).rows[0].id;
 patient=(await db.query("INSERT INTO rom_patient(hn,first_name,last_name,birth_date,phone,department,registration_key) VALUES($1,'stock','test','2000-01-01','0812345678','GN',$2) RETURNING id::text",[hn,randomUUID()])).rows[0].id;
 await db.query("INSERT INTO rom_medicine(id,name,dosage_form,unit,stock) VALUES($1,'stock-test','ยาเม็ด','เม็ด',5.5)",[medicine]);
 const form=(quantity:string,key=randomUUID())=>{const f=new FormData(); for(const [k,v] of Object.entries({...emptyDrugLabel,'drug-name':'forged',quantity,directions:'test',dispenser:'test'}))f.set(k,v);f.set('hn',hn);f.set('dispensing-key',key);f.set('medicine-id',medicine);return f;};
 const first=form('2.25');await recordDispensing(first,actor);await recordDispensing(first,actor);
 assert.equal((await db.query('SELECT stock::text FROM rom_medicine WHERE id=$1',[medicine])).rows[0].stock,'3.25');
 const saved=(await db.query('SELECT drug_name,medicine_id FROM rom_dispensing WHERE id=$1',[first.get('dispensing-key')])).rows[0];assert.equal(saved.drug_name,'stock-test');assert.equal(saved.medicine_id,medicine);
 await assert.rejects(recordDispensing(form('4'),actor),/ไม่เพียงพอ/);
 const bad=form('1');bad.set('hn','NOT-FOUND');await assert.rejects(recordDispensing(bad,actor),/ไม่พบผู้ป่วย/);
 assert.equal((await db.query('SELECT stock::text FROM rom_medicine WHERE id=$1',[medicine])).rows[0].stock,'3.25');
 const worker=(f:FormData)=>new Promise<string>((resolve,reject)=>{
  const child=spawn(process.execPath,['--conditions=react-server','--import','tsx','scripts/test-dispensing-stock.ts','worker',JSON.stringify({actor,form:Object.fromEntries(f.entries())})],{stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',chunk=>output+=chunk);child.on('error',reject);child.on('close',code=>code===0?resolve(output.trim()):reject(new Error('worker failed')));
 });
 const race = await Promise.all([worker(form('2')),worker(form('2'))]);
 assert.deepEqual(race.sort(),['rejected','saved']);
 assert.equal((await db.query('SELECT stock::text FROM rom_medicine WHERE id=$1',[medicine])).rows[0].stock,'1.25');
 const duplicate=form('0.25');assert.deepEqual(await Promise.all([worker(duplicate),worker(duplicate)]),['saved','saved']);
 assert.equal((await db.query('SELECT stock::text FROM rom_medicine WHERE id=$1',[medicine])).rows[0].stock,'1.00');
 await db.query('UPDATE rom_medicine SET archived_at=now() WHERE id=$1',[medicine]);await assert.rejects(recordDispensing(form('1'),actor),/ไม่พบยา/);
 console.log('PASS: decimal stock deduction, canonical medicine, idempotency, insufficient stock, rollback, concurrent requests and archived medicine');
 }finally{await db.query('DELETE FROM rom_dispensing WHERE medicine_id=$1',[medicine]);if(patient)await db.query('DELETE FROM rom_patient WHERE id=$1',[patient]);await db.query('DELETE FROM rom_medicine WHERE id=$1',[medicine]);await closeDatabase();}
}
void main().catch(()=>{console.error('Stock integration test failed');process.exitCode=1;});
