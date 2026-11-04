"use client";
import { useState, useTransition } from "react";
import type { Course } from "@/lib/courses";
import { assignPatientCourse } from "@/app/(admin)/settings/course-actions";
export function PatientCourseSelect({ patientId, hn, courseId, courseName, courses }: { patientId: string; hn: string; courseId: string | null; courseName: string | null; courses: Course[] }) {
  const [selected, setSelected] = useState(courseId || ""); const [pending, start] = useTransition(); const [error, setError] = useState("");
  return <div className="patient-course-select"><select aria-label={`เลือกคอร์ส ${hn}`} value={selected} disabled={pending} onChange={event => { const value = event.target.value; setError(""); start(async () => { try { const result = await assignPatientCourse(patientId, value); if (result.error) setError(result.error); else setSelected(value); } catch { setError("เลือกคอร์สไม่สำเร็จ"); } }); }}><option value="">ยังไม่เลือกคอร์ส</option>{courseId && !courses.some(course => course.id === courseId) && <option value={courseId} disabled>{courseName} (คอร์สที่ลบแล้ว)</option>}{courses.map(course => <option key={course.id} value={course.id}>{course.name} · ฿{new Intl.NumberFormat("th-TH").format(Number(course.price))}</option>)}</select>{pending && <span role="status">กำลังบันทึก…</span>}{error && <p role="alert">{error}</p>}</div>;
}
