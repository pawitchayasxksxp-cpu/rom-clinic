import { randomUUID } from "node:crypto";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { PageHeading } from "@/components/page-ui";
import { PatientRegistrationForm } from "@/components/patient-registration-form";

export const instant = false;
export const metadata = { title: "ลงทะเบียนผู้ป่วย | ROM Clinic" };

export default async function NewPatientPage() {
  await requireAdmin();
  return <>
    <PageHeading eyebrow="PATIENT REGISTRATION" title="ลงทะเบียนผู้ป่วย" description="กรอกข้อมูลผู้ป่วยและตรวจสอบก่อนบันทึก">
      <Link href="/registration" className="button button-secondary"><ArrowLeft size={18} />กลับรายชื่อผู้ป่วย</Link>
    </PageHeading>
    <section className="panel">
      <PatientRegistrationForm registrationKey={randomUUID()} />
    </section>
  </>;
}
