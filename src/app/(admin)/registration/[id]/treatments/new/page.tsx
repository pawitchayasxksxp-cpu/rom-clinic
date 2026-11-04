import { purchasedCourses } from "@/lib/billing";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getPatient } from "@/lib/patients";
import { bangkokToday } from "@/lib/calendar";
import { PageHeading } from "@/components/page-ui";
import { ClinicalForm } from "@/components/clinical-form";
export const instant = false;
export const metadata = { title: "บันทึกประวัติการรักษา | ROM Clinic" };
export default async function NewTreatmentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();
  const courses = await purchasedCourses(id);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
  return <><PageHeading eyebrow="TREATMENT RECORD" title="บันทึกประวัติการรักษา" description={`${patient.hn} · ${patient.first_name} ${patient.last_name}`}><Link href={`/registration/${id}#treatment-history`} className="button button-secondary">กลับรายละเอียดผู้ป่วย</Link></PageHeading><section className="panel"><ClinicalForm courses={courses} mode="treatment" patientId={id} recordKey={randomUUID()} date={bangkokToday()} time={time} provider={user.name} /></section></>;
}
