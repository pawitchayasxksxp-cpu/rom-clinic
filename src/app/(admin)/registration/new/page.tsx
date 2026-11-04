import { randomUUID } from "node:crypto";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { patientHnPreview } from "@/lib/patients";
import { listCourses } from "@/lib/courses";
import { PageHeading } from "@/components/page-ui";
import { PatientRegistrationForm } from "@/components/patient-registration-form";

export const instant = false;
export const metadata = { title: "ลงทะเบียนผู้ป่วย | ROM Clinic" };

export default async function NewPatientPage() {
  await requireAdmin();
  const [courses, hnPreview] = await Promise.all([listCourses(), patientHnPreview()]);
  return <>
    <PageHeading eyebrow="PATIENT REGISTRATION" title="ลงทะเบียนผู้ป่วย" description="กรอกข้อมูลผู้ป่วยและตรวจสอบก่อนบันทึก">
      <Link href="/registration" className="button button-secondary"><ArrowLeft size={18} />กลับรายชื่อผู้ป่วย</Link>
    </PageHeading>
    <section className="panel">
      <PatientRegistrationForm hnPreview={hnPreview} courses={courses} registrationKey={randomUUID()} />
    </section>
  </>;
}
