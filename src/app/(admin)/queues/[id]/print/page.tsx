import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {requireAdmin} from '@/lib/session';
import {getExamination} from '@/lib/examinations';
import {patientReport} from '@/lib/patient-report';
import {PageHeading} from '@/components/page-ui';
import {DocumentPrintButtons} from '@/components/document-print-buttons';
import {PatientReportSheet} from '@/components/patient-report-sheet';
import {PatientOPDReport} from '@/components/patient-opd-report';
export const instant=false;
export const metadata={title:'OPD ห้องตรวจ | ROM Clinic'};
export default async function PrintExamination({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{print?:string}>}){
 await requireAdmin();const{id}=await params;const room=await getExamination(id);if(!room)notFound();if(!room.treatment_id)redirect(`/queues/${id}`);const report=await patientReport(room.patient_id,room.treatment_id);if(!report)notFound();const query=await searchParams;
 return <div className="patient-summary-print-page clinical-summary-print-page"><PageHeading eyebrow="EXAMINATION OPD DOCUMENT" title="เอกสาร OPD ห้องตรวจ" description={`${room.number} · ${room.hn} · ${room.name}`}><DocumentPrintButtons selector=".patient-onepage-sheet"/></PageHeading><div className="print-actions"><Link href={`/queues/${id}`} className="button button-secondary">กลับห้องตรวจ</Link></div><PatientReportSheet autoPrint={query.print==='1'}><PatientOPDReport report={report} visitLabel="ครั้งนี้"/></PatientReportSheet></div>;
}
