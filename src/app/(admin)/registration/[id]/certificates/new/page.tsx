import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getDatabase } from "@/lib/db";
import { getPatient } from "@/lib/patients";
import { bangkokToday } from "@/lib/calendar";
import { PageHeading } from "@/components/page-ui";
import { ClinicalForm } from "@/components/clinical-form";
export const instant = false;
export const metadata = { title: "ออกใบรับรองแพทย์ | ROM Clinic" };
export default async function NewCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();
  const profile = await getDatabase().query<{ details: Record<string, string> }>("SELECT details FROM rom_admin_professional WHERE user_id = $1", [user.id]);
  return <><PageHeading eyebrow="MEDICAL CERTIFICATE" title="ออกใบรับรองแพทย์" description={`${patient.hn} · ${patient.first_name} ${patient.last_name}`}><Link href={`/registration/${id}`} className="button button-secondary">กลับรายละเอียดผู้ป่วย</Link></PageHeading><section className="panel"><ClinicalForm mode="certificate" patientId={id} recordKey={randomUUID()} date={bangkokToday()} time="" provider="" professional={profile.rows[0]?.details} /></section></>;
}
