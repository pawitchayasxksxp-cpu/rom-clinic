"use client";
import { startTransition, useActionState, useState, useTransition } from "react";
import Image from "next/image";
import { MasterImageField } from "./master-image-field";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { saveCourse, deleteCourse } from "@/app/(admin)/settings/course-actions";
import type { Course } from "@/lib/courses";

function CourseForm({ id, course }: { id: string; course?: Course }) {
  const [state, action, pending] = useActionState(saveCourse, { error: "", message: "" });
  return <form className="registration-form course-form" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => action(data)); }}>
    <input type="hidden" name="course-id" value={id} /><input type="hidden" name="mode" value={course ? "update" : "create"} />
    <fieldset disabled={pending}><div className="field-grid"><div className="field"><label htmlFor={`course-name-${id}`}>ชื่อคอร์ส <span>*</span></label><input id={`course-name-${id}`} name="name" required maxLength={200} defaultValue={course?.name || ""} /></div><div className="field"><label htmlFor={`course-price-${id}`}>ราคา (บาท) <span>*</span></label><input id={`course-price-${id}`} name="price" type="number" min="0" max="999999999.99" step="0.01" required defaultValue={course?.price || ""} /></div></div><div className="field"><label htmlFor={`course-description-${id}`}>รายละเอียดคอร์ส</label><textarea id={`course-description-${id}`} name="description" maxLength={2000} rows={2} defaultValue={course?.description || ""} /></div>
    <div className="field-grid"><div className="field"><label htmlFor={`course-sessions-${id}`}>จำนวนครั้งต่อคอร์ส</label><input id={`course-sessions-${id}`} name="total-sessions" type="number" min="1" max="9999" step="1" required defaultValue={course?.total_sessions || 1} /></div><div className="field"><label htmlFor={`course-validity-${id}`}>อายุคอร์ส (วัน · เว้นว่างหากไม่หมดอายุ)</label><input id={`course-validity-${id}`} name="validity-days" type="number" min="1" max="3650" step="1" defaultValue={course?.validity_days || ""} /></div></div>
    <MasterImageField id={`course-photo-${id}`} url={course?.image_url} />
    {state.error && <p className="form-error" role="alert">{state.error}</p>}{state.message && <p className="form-feedback" role="status">{state.message}</p>}
    <button className="button button-primary" type="submit" disabled={pending}>{pending ? "กำลังบันทึก…" : course ? "บันทึกการแก้ไขคอร์ส" : "เพิ่มคอร์ส"}</button></fieldset>
  </form>;
}
function CourseRow({ course }: { course: Course }) {
  const [error, setError] = useState(""); const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  return <li data-course-id={course.id}><div className="course-row-heading"><div className="master-record-heading">{course.image_url && <Image src={course.image_url} alt={course.name} width={72} height={72} unoptimized />}<div><strong>{course.name}</strong><p>{new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(Number(course.price))}</p></div></div><div className="course-row-actions"><button type="button" className="button button-secondary" disabled={pending} aria-expanded={editing} aria-controls={`course-edit-${course.id}`} onClick={() => setEditing(previous => !previous)}><Pencil size={16} />แก้ไขคอร์ส</button><button type="button" className="button button-secondary" disabled={pending} onClick={() => start(async () => { try { const result = await deleteCourse(course.id); setError(result.error); } catch { setError("ลบคอร์สไม่สำเร็จ"); } })}><Trash2 size={16} />{pending ? "กำลังลบ…" : "ลบคอร์ส"}</button></div></div><p>{course.total_sessions} ครั้ง · {course.validity_days ? `อายุ ${course.validity_days} วัน` : "ไม่กำหนดวันหมดอายุ"}</p>{course.description && <p className="course-description">{course.description}</p>}{error && <p role="alert" className="form-error">{error}</p>}<div id={`course-edit-${course.id}`} hidden={!editing}><CourseForm id={course.id} course={course} /></div></li>;
}
export function CourseManager({ courses, newId }: { courses: Course[]; newId: string }) {
  return <section className="panel course-manager" aria-label="จัดการราคาคอร์ส"><div className="panel-header"><div><h2>จัดการราคาคอร์ส</h2><p>เพิ่ม แก้ไขชื่อ ราคา และลบคอร์สที่ไม่เปิดให้บริการ</p></div></div><details className="new-course"><summary><Plus size={18} />เพิ่มคอร์สใหม่</summary><CourseForm key={newId} id={newId} /></details>{courses.length ? <ul className="course-list">{courses.map(course => <CourseRow key={JSON.stringify(course)} course={course} />)}</ul> : <div className="empty-state"><h3>ยังไม่มีคอร์ส</h3><p>เพิ่มคอร์สและราคาเพื่อให้เลือกในรายชื่อผู้ป่วย</p></div>}</section>;
}
