import test from 'node:test';
import assert from 'node:assert/strict';
import {bodyMeasurements} from '../../src/lib/body-measurements';
import {validatePatient} from '../../src/lib/patient-validation';
import {treatmentFields,validateTreatment} from '../../src/lib/clinical-validation';
import {randomUUID} from 'node:crypto';
test('BMI is calculated from kg/cm; missing measurements remain blank and invalid inputs are rejected',()=>{
 assert.equal(bodyMeasurements('70','175').bmi,'22.86');assert.equal(bodyMeasurements('60','160').bmi,'23.44');assert.equal(bodyMeasurements('','170').bmi,'');for(const [w,h]of [['-1','170'],['0','170'],['501','170'],['70','301'],['70.001','170']])assert.throws(()=>bodyMeasurements(w,h));
});
test('patient and visit BMI are recalculated rather than trusting submitted values',()=>{
 const f=new FormData();for(const[k,v]of Object.entries({'patient-type':'ผู้ป่วยใหม่','first-name':'test','last-name':'test','birth-date':'2000-01-01',phone:'0000000000',department:'GN',priority:'normal',weight:'70',height:'175',bmi:'999'}))f.set(k,v);assert.equal(validatePatient(f).data?.bmi,'22.86');
 const t=new FormData();for(const k of treatmentFields)t.set(k,'');for(const[k,v]of Object.entries({'patient-id':'1','record-key':randomUUID(),'visit-date':'2000-01-01','visit-time':'00:00',department:'GN',symptoms:'test',treatment:'test',provider:'test',weight:'70',height:'175',bmi:'999','illness-history':'past history'}))t.set(k,v);assert.equal(validateTreatment(t).data?.bmi,'22.86');assert.equal(validateTreatment(t).data?.['illness-history'],'past history');t.set('illness-history','x'.repeat(4001));assert(validateTreatment(t).error);
});
