import { DeletePatientButton } from "@/components/delete-patient-button";
import Link from "next/link";
import { Accessibility, Eye, FilePlus2, Plus, UsersRound } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { listPatients } from "@/lib/patients";
import { departmentName } from "@/lib/navigation";
import { listCourses } from "@/lib/courses";
import { PatientCourseSelect } from "@/components/patient-course-select";
import { PatientServiceSelect } from "@/components/patient-service-select";
import { PatientLiveSearch } from "@/components/patient-live-search";
import { PageHeading } from "@/components/page-ui";

export const instant = false;
export const metadata = { title: "รายชื่อผู้ป่วย | ROM Clinic" };

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; saved?: string; deleted?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const search = (typeof params.q === "string" ? params.q : "").trim().slice(0, 100);
  const page = Math.min(100000, Math.max(1, Number.parseInt(params.page || "1", 10) || 1));
  const [{ patients, hasNext }, courses] = await Promise.all([listPatients(search, page), listCourses()]);
  const pageUrl = (value: number) => `/registration?${new URLSearchParams({ q: search, page: String(value) })}`;
  return <>
    <PageHeading eyebrow="PATIENT DIRECTORY" title="รายชื่อผู้ป่วย" description="ค้นหาและดูรายชื่อผู้ป่วยที่ลงทะเบียนในคลินิก">
      <Link href="/registration/new" className="button button-primary"><Plus size={18} />ลงทะเบียนผู้ป่วย</Link>
    </PageHeading>
    {params.saved === "1" && <p className="form-feedback" role="status">บันทึกข้อมูลผู้ป่วยเรียบร้อยแล้ว</p>}
    {params.deleted === "1" && <p className="form-feedback" role="status">ลบผู้ป่วยออกจากรายชื่อแล้ว</p>}
    <section className="panel">
      <div className="panel-header"><h2><UsersRound size={20} />รายชื่อผู้ป่วย</h2></div>
      <PatientLiveSearch initialQuery={search} />
      {patients.length ? <div className="patient-table-scroll"><table className="patient-table">
        <caption className="sr-only">รายชื่อผู้ป่วย หน้า {page}</caption>
        <thead><tr><th scope="col">HN</th><th scope="col">ชื่อ–นามสกุล</th><th scope="col">ประเภทบริการ</th><th scope="col">คอร์ส</th><th scope="col">ราคา (บาท)</th><th scope="col">คอร์สคงเหลือ</th><th scope="col">โทรศัพท์</th><th scope="col">แผนก</th><th scope="col">ความดัน (mmHg)</th><th scope="col">ชีพจร (ครั้ง/นาที)</th><th scope="col">วันที่ลงทะเบียน</th><th scope="col" className="patient-action-cell">จัดการ</th></tr></thead>
        <tbody>{patients.map(patient => <tr key={patient.id}><td>{patient.hn}</td><td>{patient.first_name} {patient.last_name}</td><td><PatientServiceSelect key={patient.service_type || ""} id={patient.id} hn={patient.hn} value={patient.service_type} /></td><td><PatientCourseSelect key={patient.course_id || ""} patientId={patient.id} hn={patient.hn} courseId={patient.course_id} courseName={patient.course_name} courses={courses} /></td><td className="patient-price-cell">{patient.course_price != null ? `฿${new Intl.NumberFormat("th-TH").format(Number(patient.course_price))}` : "—"}</td><td className="patient-course-balance">{patient.course_balance || "—"}</td><td>{patient.phone}</td><td>{departmentName(patient.department)}</td><td>{patient.bp_systolic && patient.bp_diastolic ? `${patient.bp_systolic}/${patient.bp_diastolic}` : "—"}</td><td>{patient.pulse || "—"}</td><td>{patient.registered_date}</td><td className="patient-action-cell"><div className="patient-row-actions"><Link href={`/registration/${patient.id}?${new URLSearchParams({ q: search, page: String(page) })}`} className="icon-button patient-view-button" aria-label={`ดูรายละเอียด ${patient.hn}`} title="ดูรายละเอียดผู้ป่วย"><Eye size={20} aria-hidden="true" /></Link><Link href={`/registration/${patient.id}/certificates/new`} className="icon-button patient-view-button" aria-label={`ออกใบรับรองแพทย์ ${patient.hn}`} title="ออกใบรับรองแพทย์"><FilePlus2 size={20} aria-hidden="true" /></Link><Link href={`/registration/${patient.id}/body-chart`} className="icon-button patient-view-button" aria-label={`Body Chart ${patient.hn}`} title="Body Chart"><Accessibility size={20} aria-hidden="true" /></Link><DeletePatientButton id={patient.id} hn={patient.hn} name={`${patient.first_name} ${patient.last_name}`} compact /></div></td></tr>)}</tbody>
      </table></div> : <div className="empty-state"><span className="empty-icon"><UsersRound size={28} /></span><h3>{search ? "ไม่พบผู้ป่วยที่ค้นหา" : "ยังไม่มีรายชื่อผู้ป่วย"}</h3><p>{search ? "ลองค้นหาด้วยชื่อ HN หรือเบอร์โทรศัพท์อื่น" : "กดปุ่มลงทะเบียนผู้ป่วยเพื่อเพิ่มข้อมูลผู้ป่วยคนแรก"}</p></div>}
      {(page > 1 || hasNext) && <nav className="patient-pagination" aria-label="หน้ารายชื่อผู้ป่วย">{page > 1 && <Link className="button button-secondary" href={pageUrl(page - 1)}>หน้าก่อนหน้า</Link>}<span>หน้า {page}</span>{hasNext && <Link className="button button-secondary" href={pageUrl(page + 1)}>หน้าถัดไป</Link>}</nav>}
    </section>
  </>;
}
