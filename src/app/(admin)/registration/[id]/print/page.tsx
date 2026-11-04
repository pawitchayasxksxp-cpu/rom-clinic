import Link from 'next/link';
import {notFound} from 'next/navigation';
import {requireAdmin} from '@/lib/session';
import {patientReport,patientReportLabels,type ReportRecord} from '@/lib/patient-report';
import {patientFieldDisplay} from '@/lib/patient-field-display';
import {patientServiceLabel} from '@/lib/patient-service';
import {departmentName} from '@/lib/navigation';
import {examinationStatus} from '@/lib/examinations';
import {PageHeading} from '@/components/page-ui';
import {DocumentPrintButtons} from '@/components/document-print-buttons';
import {PatientReportSheet} from '@/components/patient-report-sheet';
import {ClinicLogo} from '@/components/clinic-logo';
export const instant=false;
export const metadata={title:'PDF ข้อมูลผู้ป่วย | ROM Clinic'};
const statuses:Record<string,string>={...examinationStatus,confirmed:'ยืนยันนัด'};
function Fields({details,all=false}:{details:Record<string,unknown>;all?:boolean}){
 const keys=all?Object.keys(patientReportLabels).slice(0,Object.keys(patientReportLabels).indexOf('illness-history')):Object.keys(details);
 return <dl className={all?'summary-profile-fields':'summary-record-fields'}>{keys.filter(key=>!key.endsWith('-other')&&key!=='course-id'&&(all||details[key])).map(key=>{let value=patientFieldDisplay(details,key);if(key==='service-type')value=patientServiceLabel(value);if(key==='department')value=departmentName(value);if(key==='priority')value=value==='urgent'?'ด่วน':value==='normal'?'ปกติ':value;if(key==='status')value=statuses[value]||value;return <div key={key}><dt>{patientReportLabels[key]||key}</dt><dd>{value||'—'}</dd></div>;})}</dl>;
}
function Records({title,records}:{title:string;records:ReportRecord[]}){return <section className="summary-section"><h2>{title} ({records.length} รายการ)</h2>{records.length?records.map(r=><div className="summary-record" key={r.id}><h3>{r.date}{r.name?` · ${r.name}`:''}{r.department?` · ${departmentName(r.department)}`:''}</h3><Fields details={r.details}/></div>):<p className="summary-none">ไม่มีข้อมูล</p>}</section>;}
export default async function PrintPatient({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{print?:string}>}){
 await requireAdmin();const{id}=await params;const report=await patientReport(id);if(!report)notFound();const query=await searchParams;const p=report.patient;
 const details={...p.details,'first-name':p.first_name,'last-name':p.last_name,'birth-date':p.birth_date,phone:p.phone,department:p.department};
 return <div className="patient-summary-print-page"><PageHeading eyebrow="PATIENT SUMMARY PDF" title="ข้อมูลผู้ป่วยทั้งหมด" description="จัดลง A4 หนึ่งหน้า ไม่รวม Body Chart · ปรับขนาดตามปริมาณข้อมูล"><DocumentPrintButtons selector=".patient-onepage-sheet"/></PageHeading><div className="print-actions"><Link href={`/registration/${id}`} className="button button-secondary">กลับรายละเอียดผู้ป่วย</Link></div><PatientReportSheet autoPrint={query.print==='1'}><header className="summary-header"><ClinicLogo size={42}/><div><h1>ROM Clinic · ข้อมูลผู้ป่วย</h1><p>CN {p.hn} · {p.first_name} {p.last_name}</p></div><p>ลงทะเบียน {p.registered_date}<br/>ข้อมูล ณ {new Intl.DateTimeFormat('th-TH',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(new Date())}</p></header>
 <section className="summary-section"><h2>ข้อมูลส่วนตัว การติดต่อ และสุขภาพเมื่อลงทะเบียน</h2><Fields details={details} all/>{report.selectedCourse&&<p>คอร์สที่เลือก: {report.selectedCourse.name} · ราคา {report.selectedCourse.price} บาท</p>}</section>
 <Records title="ประวัติการรักษาทุกครั้ง" records={report.treatments}/><Records title="การจ่ายยาทั้งหมด" records={report.medications}/>
 <section className="summary-section"><h2>ใบรับรองแพทย์ ({report.certificates.length} ฉบับ)</h2>{report.certificates.length?report.certificates.map(c=><div className="summary-record" key={c.id}><h3>{c.name} · {c.date}</h3><Fields details={c.snapshot}/><Fields details={c.details}/></div>):<p className="summary-none">ไม่มีข้อมูล</p>}</section>
 <Records title="คอร์สที่ซื้อ" records={report.courses}/><Records title="การใช้คอร์ส" records={report.usage}/>
 <section className="summary-section"><h2>การชำระเงิน ({report.payments.length} ใบเสร็จ)</h2>{report.payments.length?report.payments.map(r=><div className="summary-record" key={r.id}><h3>{r.name} · {r.date}</h3><Fields details={r.details}/><p>{r.items.map(i=>`${i.name} × ${i.quantity} @ ${i.price} = ${i.amount} บาท`).join(' · ')}</p></div>):<p className="summary-none">ไม่มีข้อมูล</p>}</section>
 <Records title="นัดหมาย" records={report.bookings}/><Records title="คิวห้องตรวจ" records={report.examinations}/>
 </PatientReportSheet></div>;
}
