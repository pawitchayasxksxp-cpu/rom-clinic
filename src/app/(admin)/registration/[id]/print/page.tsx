import Link from 'next/link';
import {notFound} from 'next/navigation';
import {requireAdmin} from '@/lib/session';
import {patientReport} from '@/lib/patient-report';
import {PageHeading} from '@/components/page-ui';
import {DocumentPrintButtons} from '@/components/document-print-buttons';
import {PatientReportSheet} from '@/components/patient-report-sheet';
import {PatientOPDReport} from '@/components/patient-opd-report';
export const instant=false;
export const metadata={title:'ใบสรุปผู้ป่วยนอก OPD | ROM Clinic'};
export default async function PrintPatient({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{print?:string}>}){
 await requireAdmin();const{id}=await params;const report=await patientReport(id);if(!report)notFound();const query=await searchParams;
 return <div className="patient-summary-print-page clinical-summary-print-page"><PageHeading eyebrow="OPD CLINICAL SUMMARY" title="ใบสรุปข้อมูลผู้ป่วยนอก" description="ข้อมูลสำคัญสำหรับการตรวจรักษาและผลตรวจครั้งล่าสุด · A4 หนึ่งหน้า"><DocumentPrintButtons selector=".patient-onepage-sheet"/></PageHeading><div className="print-actions"><Link href={`/registration/${id}`} className="button button-secondary">กลับรายละเอียดผู้ป่วย</Link></div><PatientReportSheet autoPrint={query.print==='1'}><PatientOPDReport report={report}/></PatientReportSheet></div>;
}
