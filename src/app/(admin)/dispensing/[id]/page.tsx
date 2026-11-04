import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getDispensing } from "@/lib/dispensing";
import { PageHeading } from "@/components/page-ui";
import { DrugLabel } from "@/components/drug-label";
import { AutoPrint } from "@/components/auto-print";
import { PrintLabelButton } from "@/components/print-label-button";

export const instant = false;
export const metadata = { title: "ฉลากยา | ROM Clinic" };

export default async function DrugLabelPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const record = await getDispensing(id);
  if (!record) notFound();
  const query = await searchParams;
  return <div className="dispensing-print-page"><AutoPrint enabled={query.print === "1"} />
    <PageHeading eyebrow="MEDICATION LABEL" title="ฉลากยา" description="บันทึกข้อมูลแล้ว ตรวจสอบก่อนสั่งพิมพ์">
      <PrintLabelButton />
    </PageHeading>
    <div className="print-actions"><Link href="/dispensing" className="button button-secondary"><ArrowLeft size={17} />กลับหน้าจ่ายยา</Link><p>เลือกเครื่องพิมพ์และขนาดกระดาษในหน้าต่างพิมพ์</p></div>
    <div className="label-print-wrap"><DrugLabel data={record.details} patientName={record.patient_name} hn={record.hn} date={record.date} /></div>
  </div>;
}
