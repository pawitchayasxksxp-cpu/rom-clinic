import {loadEnvConfig} from '@next/env';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
loadEnvConfig(process.cwd(),true);
async function main(){
 const {getDatabase,closeDatabase}=await import('../src/lib/db');const client=await getDatabase().connect();
 const migration=readFileSync('database/patient-cn-schema.sql','utf8').replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,'');
 try{
  for(const collision of [false,true]){
   const schema=`cn_test_${randomUUID().replaceAll('-','')}`;await client.query('BEGIN');
   try{
    await client.query(`CREATE SCHEMA ${schema}`);await client.query(`SET LOCAL search_path TO ${schema},pg_catalog`);
    await client.query("CREATE TABLE rom_patient(id bigint PRIMARY KEY,hn text UNIQUE); CREATE SEQUENCE rom_patient_hn_seq START 7; SELECT nextval('rom_patient_hn_seq'); CREATE TABLE rom_dispensing(patient_id bigint,hn text); CREATE TABLE rom_certificate(patient_id bigint,patient_snapshot jsonb); CREATE TABLE rom_payment(patient_id bigint,hn text,total numeric)");
    await client.query("INSERT INTO rom_patient VALUES(1,'HN-000001'),(2,$1),(3,'CUSTOM-1')",[collision?'CN-000001':'CN-000003']);
    await client.query("INSERT INTO rom_dispensing VALUES(1,'HN-000001'); INSERT INTO rom_certificate VALUES(1,'{\"hn\":\"HN-000001\",\"name\":\"test\"}'); INSERT INTO rom_payment VALUES(1,'HN-000001',100)");
    if(collision){await assert.rejects(client.query(migration),/duplicate/);}
    else{
     await client.query(migration);assert.deepEqual((await client.query('SELECT hn FROM rom_patient ORDER BY id')).rows.map(r=>r.hn),['CN-000001','CN-000003','CUSTOM-1']);
     assert.equal((await client.query('SELECT hn FROM rom_dispensing')).rows[0].hn,'CN-000001');assert.equal((await client.query('SELECT patient_snapshot FROM rom_certificate')).rows[0].patient_snapshot.hn,'CN-000001');assert.equal((await client.query('SELECT hn,total::text FROM rom_payment')).rows[0].total,'100');
     assert.equal((await client.query('SELECT rom_next_patient_hn() AS cn')).rows[0].cn,'CN-000008');await client.query('DROP TABLE pg_temp.rom_cn_mapping');await client.query(migration);assert.equal((await client.query('SELECT rom_next_patient_hn() AS cn')).rows[0].cn,'CN-000009');
    }
   }finally{await client.query('ROLLBACK');}
  }
  console.log('PASS: CN migration preserves numeric identifiers, custom codes, document links and totals; allocator continues; replay is safe; collisions abort (isolated rolled-back schemas)');
 }finally{client.release();await closeDatabase();}
}
void main().catch(error=>{console.error(error instanceof Error ? error.message : 'CN migration test failed');process.exitCode=1;});
