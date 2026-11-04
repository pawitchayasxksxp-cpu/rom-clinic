import {randomUUID} from 'node:crypto';
import Link from 'next/link';
import {requireAdmin} from '@/lib/session';
import {listCourses} from '@/lib/courses';
import {getPatient} from '@/lib/patients';
import {dailyPayments,pendingMedications} from '@/lib/billing';
import {bangkokToday,isCalendarDate} from '@/lib/calendar';
import {baht} from '@/lib/money';
import {PageHeading} from '@/components/page-ui';
import {BillingForm} from '@/components/billing-form';
export const instant=false;
export const metadata={title:'ชำระเงิน | ROM Clinic'};
export default async function BillingPage({searchParams}:{searchParams:Promise<{patient?:string;date?:string}>}){
 await requireAdmin();const query=await searchParams;const patient=query.patient?await getPatient(query.patient):null;
 const date=isCalendarDate(query.date||'')?query.date!:bangkokToday();
 const courses=await listCourses();const {totals,receipts}=await dailyPayments(date);
 const medications=patient?await pendingMedications(patient.id):[];
 return <><PageHeading eyebrow="BILLING & RECEIPTS" title="ชำระเงิน" description="รับเงินค่ารักษา ค่ายา และซื้อคอร์ส พร้อมออกใบเสร็จ"/>
 <BillingForm paymentKey={randomUUID()} courses={courses} initialPatient={patient} initialMedications={medications}/>
 <section className="panel billing-daily"><div className="panel-header"><div><h2>สรุปยอดรับเงินประจำวัน</h2><p>ยอดตามวันที่รับเงิน · แสดงใบเสร็จล่าสุดสูงสุด 200 รายการ</p></div></div>
 <form className="filter-bar" method="get" action="/billing"><label htmlFor="billing-date">วันที่รับเงิน (ค.ศ.)</label><input id="billing-date" type="date" name="date" defaultValue={date}/><button type="submit" className="button button-secondary">แสดงยอด</button></form>
 <dl className="billing-totals"><div><dt>เงินสด</dt><dd>฿{baht(totals.cash)}</dd></div><div><dt>โอนเงิน</dt><dd>฿{baht(totals.transfer)}</dd></div><div><dt>ยอดรับรวม ({totals.count} ใบเสร็จ)</dt><dd>฿{baht(totals.total)}</dd></div><div><dt>ส่วนลดรวม</dt><dd>฿{baht(totals.discount)}</dd></div></dl>
 {receipts.length?<div className="patient-table-scroll"><table className="patient-table"><thead><tr><th>เลขที่ใบเสร็จ</th><th>เวลา</th><th>ผู้ป่วย</th><th>วิธีชำระเงิน</th><th>ยอดสุทธิ (บาท)</th><th>ใบเสร็จ</th></tr></thead><tbody>{receipts.map(r=><tr key={r.id}><td>{r.number}</td><td>{r.time}</td><td>{r.hn} · {r.patient_name}</td><td>{r.method==='cash'?'เงินสด':'โอนเงิน'}</td><td>{baht(r.total)}</td><td><Link href={`/billing/${r.id}`} className="text-link">ดู / พิมพ์</Link></td></tr>)}</tbody></table></div>:<div className="empty-state"><h3>ยังไม่มีรายการรับเงินในวันนี้</h3></div>}</section></>;
}
