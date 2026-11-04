import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {cents,decimal,lineCents} from '../../src/lib/money';
import {validatePayment} from '../../src/lib/billing-validation';
import {validateCourse} from '../../src/lib/course-validation';
const form=(overrides:Record<string,string>={})=>{const f=new FormData();for(const [k,v]of Object.entries({'payment-key':randomUUID(),'patient-id':'1',method:'cash',items:JSON.stringify([{kind:'service',sourceId:'',name:'test',quantity:'2',price:'100.25'}]),discount:'0',received:'250',note:'',reference:'',...overrides}))f.set(k,v);return f;};
test('money uses exact cents and half-up multiplication',()=>{
 assert.equal(cents('0.10')+cents('0.20'),30);assert.equal(lineCents('10.10','0.05'),51);assert.equal(decimal(51),'0.51');assert.throws(()=>cents('-1'));assert.throws(()=>cents('1.001'));assert.throws(()=>lineCents('999999999.99','2'));assert.throws(()=>lineCents('1','0'));
});
test('payments validate discounts, tenders, totals and sources',()=>{
 assert.equal(validatePayment(form()).received,25000);assert.throws(()=>validatePayment(form({discount:'250',note:'test'})),/ส่วนลด/);assert.throws(()=>validatePayment(form({discount:'10'})),/เหตุผล/);assert.throws(()=>validatePayment(form({received:'1'})),/ไม่เพียงพอ/);assert.throws(()=>validatePayment(form({method:'transfer'})),/ยอดโอน/);assert.throws(()=>validatePayment(form({items:'[]'})));assert.throws(()=>validatePayment(form({'patient-id':'9223372036854775808'})));
 const course={kind:'course',sourceId:randomUUID(),name:'course',quantity:'1',price:'100',sessions:1,validityDays:null};assert.throws(()=>validatePayment(form({items:JSON.stringify([course,course])})),/ซ้ำ/);assert.throws(()=>validatePayment(form({items:JSON.stringify([{...course,quantity:'2'}])})),/1 คอร์ส/);
});
test('course session count and expiry are validated',()=>{
 const f=new FormData();for(const[k,v]of Object.entries({'course-id':randomUUID(),name:'test',price:'100',description:'','total-sessions':'10','validity-days':'30'}))f.set(k,v);
 assert.equal(validateCourse(f).data?.totalSessions,10);f.set('total-sessions','0');assert(validateCourse(f).error);f.set('total-sessions','10');f.set('validity-days','3651');assert(validateCourse(f).error);
});
