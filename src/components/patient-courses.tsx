import {randomUUID} from 'node:crypto';
import Link from 'next/link';
import {getDatabase} from '@/lib/db';
import {requireAdmin} from '@/lib/session';
import {purchasedCourses,patientCourseHistory} from '@/lib/billing';
import {CourseUsageForm} from './course-usage-form';
import {baht} from '@/lib/money';
export async function PatientCourses({patientId}:{patientId:string}){
 await requireAdmin();const courses=await purchasedCourses(patientId);const {treatments,usage}=await patientCourseHistory(patientId);const key=randomUUID();
 const payments=(await getDatabase().query<{id:string;number:string;date:string;total:string}>("SELECT id,'RC-'||lpad(number::text,greatest(6,length(number::text)),'0') AS number,to_char(created_at AT TIME ZONE 'Asia/Bangkok','DD/MM/YYYY HH24:MI') AS date,total::text FROM rom_payment WHERE patient_id=$1 ORDER BY created_at DESC LIMIT 10",[patientId])).rows;
 return <section className="panel patient-owned-courses" aria-label="คอร์สและการชำระเงินของผู้ป่วย"><div className="panel-header"><h2>คอร์สและการชำระเงิน</h2><Link href={`/billing?patient=${patientId}`} className="button button-primary">ชำระเงิน / ซื้อคอร์ส</Link></div>
 {courses.length?<div className="patient-table-scroll"><table className="patient-table"><thead><tr><th>คอร์สที่ซื้อ</th><th>วันที่ซื้อ</th><th>ใช้แล้ว</th><th>คงเหลือ</th><th>วันหมดอายุ (ค.ศ.)</th><th>สถานะ</th><th>ใบเสร็จ</th></tr></thead><tbody>{courses.map(c=><tr key={c.id} data-purchased-course={c.id}><td>{c.name}</td><td>{c.date}</td><td>{c.total_sessions-c.remaining} / {c.total_sessions}</td><td>{c.remaining} ครั้ง</td><td>{c.expires_on||'ไม่กำหนด'}</td><td>{c.expired?'หมดอายุ':c.remaining===0?'ใช้ครบแล้ว':'ใช้ได้'}</td><td><Link className="text-link" href={`/billing/${c.payment_id}`}>ดูใบเสร็จ</Link></td></tr>)}</tbody></table></div>:<p className="billing-panel-note">ยังไม่มีคอร์สที่ชำระเงินแล้ว</p>}
 <CourseUsageForm key={key} patientId={patientId} usageKey={key} courses={courses} treatments={treatments}/>
 {usage.length>0&&<details className="billing-details"><summary>ประวัติการใช้คอร์ส 20 รายการล่าสุด</summary><ul>{usage.map(u=><li key={u.id}>{u.name} · วันที่รักษา {u.visit_date} · ผู้ให้บริการ {u.provider} · บันทึกตัดคอร์ส {u.date}</li>)}</ul></details>}
 {payments.length>0&&<details className="billing-details"><summary>ใบเสร็จ 10 รายการล่าสุด</summary><ul>{payments.map(p=><li key={p.id}><Link className="text-link" href={`/billing/${p.id}`}>{p.number}</Link> · {p.date} · ฿{baht(p.total)}</li>)}</ul></details>}</section>;
}
