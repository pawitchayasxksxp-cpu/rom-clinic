import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getCertificate } from "@/lib/clinical";
import { PageHeading } from "@/components/page-ui";
import { MedicalCertificate } from "@/components/medical-certificate";
import { DocumentPrintButtons } from "@/components/document-print-buttons";
import { AutoPrint } from "@/components/auto-print";
export const instant = false;
export const metadata = { title: "ใบรับรองแพทย์ | ROM Clinic" };
export default async function CertificatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{print?:string}> }) {
  await requireAdmin();
  const { id } = await params;
  const certificate = await getCertificate(id);
  if (!certificate) notFound();
  const query = await searchParams;
  return <div className="certificate-print-page"><AutoPrint enabled={query.print === "1"} /><PageHeading eyebrow="MEDICAL CERTIFICATE" title="ใบรับรองแพทย์" description="ตรวจสอบข้อมูลและให้ผู้ตรวจลงนามในเอกสาร"><DocumentPrintButtons selector=".medical-certificate" /></PageHeading><div className="print-actions"><Link href={`/registration/${certificate.patient_id}#treatment-history`} className="button button-secondary">กลับประวัติผู้ป่วย</Link></div><MedicalCertificate certificate={certificate} /></div>;
}
