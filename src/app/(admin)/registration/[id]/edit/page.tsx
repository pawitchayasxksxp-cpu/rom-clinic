import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getPatient } from "@/lib/patients";
import { getCourse, listCourses } from "@/lib/courses";
import { PageHeading } from "@/components/page-ui";
import { PatientRegistrationForm } from "@/components/patient-registration-form";

export const instant = false;
export const metadata = { title: "แก้ไขข้อมูลผู้ป่วย | ROM Clinic" };

export default async function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();
  const courses = await listCourses();
  if (patient.course_id && !courses.some(course => course.id === patient.course_id)) { const oldCourse = await getCourse(patient.course_id); if (oldCourse) courses.push(oldCourse); }
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(patient.details)) if (typeof value === "string") values[key] = value;
  Object.assign(values, {
    "first-name": patient.first_name, "last-name": patient.last_name,
    "birth-date": patient.birth_date, phone: patient.phone, department: patient.department,
    "patient-type": values["patient-type"] || "ผู้ป่วยเดิม", "course-id": patient.course_id || "",
  });
  return <>
    <PageHeading eyebrow="EDIT PATIENT" title="แก้ไขข้อมูลผู้ป่วย" description={`CN ${patient.hn} · ${patient.first_name} ${patient.last_name}`}>
      <Link href={`/registration/${id}`} className="button button-secondary"><ArrowLeft size={18} />กลับรายละเอียดผู้ป่วย</Link>
    </PageHeading>
    <section className="panel"><PatientRegistrationForm courses={courses} patient={{ id, hn: patient.hn, values }} /></section>
  </>;
}
