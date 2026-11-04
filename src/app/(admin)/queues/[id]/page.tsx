import Link from 'next/link';
import {notFound} from 'next/navigation';
import {requireAdmin} from '@/lib/session';
import {getExamination,examinationStatus} from '@/lib/examinations';
import {purchasedCourses} from '@/lib/billing';
import {bangkokToday} from '@/lib/calendar';
import {PageHeading} from '@/components/page-ui';
import {ClinicalForm} from '@/components/clinical-form';
import {ExaminationStateForm} from '@/components/examination-state-form';
export const instant=false;
export const metadata={title:'ห้องตรวจ | ROM Clinic'};
export default async function ExaminationPage({params}:{params:Promise<{id:string}>}){
 const user=await requireAdmin();const {id}=await params;const room=await getExamination(id);if(!room)notFound();
 const courses=await purchasedCourses(room.patient_id);const time=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());const active=['waiting','examining'].includes(room.status);
 return <><div className="patient-detail-back"><Link href="/queues" className="button button-secondary">กลับรายการห้องตรวจ</Link></div><PageHeading eyebrow="EXAMINATION ROOM" title="ห้องตรวจ" description={`${room.number} · ${room.hn} · ${room.name}`}><div className="registration-action-buttons">{room.treatment_id && <Link data-room-report="true" href={`/queues/${id}/print?print=1`} className="button button-primary">พิมพ์เอกสาร OPD</Link>}<Link href={`/registration/${room.patient_id}`} className="button button-secondary">รายละเอียดผู้ป่วย</Link></div></PageHeading><p className="form-feedback" role="status">สถานะ: {examinationStatus[room.status]}</p>{active?<><ExaminationStateForm id={id} status={room.status}/><section className="panel"><ClinicalForm mode="treatment" patientId={room.patient_id} recordKey={id} queueId={id} defaultDepartment={room.department} date={bangkokToday()} time={time} provider={user.name} courses={courses}/></section></>:<section className="panel"><div className="empty-state"><h2>{examinationStatus[room.status]}</h2><p>ส่งห้องตรวจเมื่อมารับบริการครั้งใหม่ได้จากรายชื่อผู้ป่วย</p><Link href={`/registration/${room.patient_id}#treatment-history`} className="button button-secondary">ดูประวัติการรักษา</Link></div></section>}</>;
}
