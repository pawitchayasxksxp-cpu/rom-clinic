import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getPatient } from "@/lib/patients";
import { bangkokToday } from "@/lib/calendar";
import { PageHeading } from "@/components/page-ui";
import { BodyChartForm } from "@/components/body-chart-form";
export const instant = false;
export const metadata = { title: "เพิ่ม Body Chart | ROM Clinic" };
export default async function NewBodyChart({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin(); const { id } = await params; const patient = await getPatient(id); if (!patient) notFound();
  return <><PageHeading eyebrow="NEW BODY CHART" title="เพิ่ม Body Chart" description={`${patient.hn} · ${patient.first_name} ${patient.last_name}`}><Link href={`/registration/${id}/body-chart`} className="button button-secondary">กลับ Body Chart ผู้ป่วย</Link></PageHeading><section className="panel"><BodyChartForm patientId={id} recordKey={randomUUID()} date={bangkokToday()} provider={user.name} /></section></>;
}
