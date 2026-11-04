import { DeletePatientButton } from "@/components/delete-patient-button";
import { PatientCourses } from "@/components/patient-courses";
import { SendToExaminationButton } from "@/components/send-to-examination-button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accessibility, ArrowLeft, FilePlus2, HeartPulse, Pencil, UserRound, FileDown, ReceiptText } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getPatient, latestPatientMeasurements } from "@/lib/patients";
import { getCourse } from "@/lib/courses";
import { patientFieldDisplay } from "@/lib/patient-field-display";
import { patientServiceLabel } from "@/lib/patient-service";
import { departmentName } from "@/lib/navigation";
import { PatientClinicalHistory } from "@/components/patient-clinical-history";
import { PageHeading } from "@/components/page-ui";

export const instant = false;
export const metadata = { title: "รายละเอียดผู้ป่วย | ROM Clinic" };

type Item = readonly [string, string];

function DetailSection({ title, items }: { title: string; items: readonly Item[] }) {
  return <section className="panel patient-detail-section">
    <div className="panel-header"><h2>{title}</h2></div>
    <dl className="patient-detail-list">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl>
  </section>;
}

export default async function PatientDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; page?: string; saved?: string; "history-page"?: string; "treatment-saved"?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();
  const measurements = await latestPatientMeasurements(id);
  const course = patient.course_id ? await getCourse(patient.course_id) : null;
  const query = await searchParams;
  const backParams = new URLSearchParams();
  if (typeof query.q === "string" && query.q) backParams.set("q", query.q.slice(0, 100));
  if (typeof query.page === "string" && /^[1-9]\d{0,5}$/.test(query.page)) backParams.set("page", query.page);
  const historyPage = Math.min(100000, Math.max(1, Number.parseInt(query["history-page"] || "1", 10) || 1));
  const backUrl = `/registration${backParams.size ? `?${backParams}` : ""}`;
  const value = (key: string) => patientFieldDisplay(patient.details, key);
  const department = departmentName(patient.department);
  const birthDate = new Intl.DateTimeFormat("th-TH", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${patient.birth_date}T00:00:00Z`));
  const address = (prefix: string): Item[] => [
    ["บ้านเลขที่ หมู่ อาคาร ซอย ถนน", value(`${prefix}-line`)],
    ["ตำบล / แขวง", value(`${prefix}-subdistrict`)],
    ["อำเภอ / เขต", value(`${prefix}-district`)],
    ["จังหวัด", value(`${prefix}-province`)],
    ["รหัสไปรษณีย์", value(`${prefix}-postal-code`)],
  ];
  const bp = value("bp-systolic") && value("bp-diastolic") ? `${value("bp-systolic")}/${value("bp-diastolic")}` : "—";
  return <>
    <div className="patient-detail-back"><Link href={backUrl} className="button button-secondary"><ArrowLeft size={18} />กลับรายชื่อผู้ป่วย</Link></div>
    <PageHeading eyebrow="PATIENT DETAILS" title="รายละเอียดผู้ป่วย" description={`${patient.hn} · ลงทะเบียน ${patient.registered_date}`}>
      <div className="registration-action-buttons"><Link href={`/billing?patient=${id}`} className="button button-primary"><ReceiptText size={18} />ไปหน้าชำระเงิน</Link><Link href={`/registration/${id}/print?print=1`} className="button button-secondary"><FileDown size={18} />พิมพ์ใบสรุป OPD</Link><SendToExaminationButton patientId={id} cn={patient.hn} /><Link href={`/registration/${id}/body-chart`} className="button button-secondary"><Accessibility size={18} />Body Chart</Link><Link href={`/registration/${id}/certificates/new`} className="button button-secondary"><FilePlus2 size={18} />ออกใบรับรองแพทย์</Link><Link href={`/registration/${id}/edit`} className="button button-primary"><Pencil size={18} />แก้ไขข้อมูล</Link><DeletePatientButton id={id} hn={patient.hn} name={`${patient.first_name} ${patient.last_name}`} /></div>
    </PageHeading>
    {query.saved === "1" && <p role="status" className="form-feedback">บันทึกการแก้ไขข้อมูลผู้ป่วยเรียบร้อยแล้ว</p>}
    <section className="panel patient-profile" aria-label="ข้อมูลสรุปผู้ป่วย">
      <div className="patient-profile-name"><span className="empty-icon"><UserRound size={28} /></span><div><h2>{value("title")} {patient.first_name} {patient.last_name}</h2><p>{patient.hn} · แผนก{department}</p></div></div>
      <dl className="patient-vitals" aria-label="สัญญาณชีพเมื่อลงทะเบียน">
        <div><dt><HeartPulse size={17} />ความดันเมื่อลงทะเบียน</dt><dd>{bp} <small>mmHg</small></dd></div>
        <div><dt>ชีพจรเมื่อลงทะเบียน</dt><dd>{value("pulse") || "—"} <small>ครั้ง/นาที</small></dd></div>
        <div><dt>หมู่เลือด</dt><dd>{value("blood-group") || "—"}</dd></div>
      </dl>
      <div className="patient-measurement-summary" aria-label="การวัดร่างกายล่าสุด"><p>{measurements ? `การวัดร่างกายล่าสุด · ${measurements.date}` : `การวัดร่างกายเมื่อลงทะเบียน · ${patient.registered_date}`}</p><dl className="patient-vitals"><div><dt>น้ำหนัก</dt><dd>{(measurements ? measurements.weight : value("weight")) || "—"} <small>กก.</small></dd></div><div><dt>ส่วนสูง</dt><dd>{(measurements ? measurements.height : value("height")) || "—"} <small>ซม.</small></dd></div><div><dt>BMI</dt><dd>{(measurements ? measurements.bmi : value("bmi")) || "—"} <small>กก./ม²</small></dd></div></dl></div>
    </section>
    {query["treatment-saved"] === "1" && <p role="status" className="form-feedback">บันทึกประวัติการรักษาเรียบร้อยแล้ว</p>}
    <PatientCourses patientId={id} />
    <PatientClinicalHistory expanded={typeof query["history-page"] === "string" || query["treatment-saved"] === "1"} patientId={id} page={historyPage} query={backParams.toString()} />
    <div className="patient-detail-grid">
      <DetailSection title="ข้อมูลส่วนตัวและการติดต่อ" items={[
        ["เลขประจำตัวผู้ป่วย (CN)", patient.hn], ["ประเภทผู้ป่วย", value("patient-type")], ["ประเภทบริการ", patientServiceLabel(value("service-type"))],
        ["คอร์ส", course ? `${course.name}${course.archived ? " (คอร์สที่ลบแล้ว)" : ""}` : ""], ["ราคาคอร์ส", course ? new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(Number(course.price)) : ""],
        ["ชื่อ–นามสกุล", `${patient.first_name} ${patient.last_name}`], ["คำนำหน้าชื่อ", value("title")],
        ["ประเภทเอกสารยืนยันตัวตน", value("identity-type")], ["เลขที่เอกสาร", value("identity-number")],
        ["วันเดือนปีเกิด", birthDate], ["เพศ", value("sex")], ["สัญชาติ", value("nationality")],
        ["สถานภาพสมรส", value("marital-status")], ["อาชีพ", value("occupation")],
        ["โทรศัพท์ผู้ป่วย / ผู้ปกครอง", patient.phone], ["อีเมล", value("email")],
      ]} />
      <DetailSection title="ข้อมูลสุขภาพและการเข้ารับบริการ" items={[
        ["แผนก", department], ["ความเร่งด่วน", value("priority") === "urgent" ? "ด่วน" : value("priority") === "normal" ? "ปกติ" : ""],
        ["อาการสำคัญ / เหตุผลที่มารับบริการ", value("symptoms")], ["ประวัติแพ้ยา / อาหาร", value("allergy-status")],
        ["สิ่งที่แพ้และอาการแพ้", value("allergy-details")], ["โรคประจำตัว / ยาที่ใช้ประจำ", value("conditions")],
        ["ความดันตัวบน (mmHg)", value("bp-systolic")], ["ความดันตัวล่าง (mmHg)", value("bp-diastolic")],
        ["ชีพจร (ครั้ง/นาที)", value("pulse")], ["น้ำหนักเมื่อลงทะเบียน (กก.)", value("weight")], ["ส่วนสูงเมื่อลงทะเบียน (ซม.)", value("height")], ["BMI เมื่อลงทะเบียน (กก./ม²)", value("bmi")],
      ]} />
      <DetailSection title="ที่อยู่ตามทะเบียนบ้าน" items={address("registered")} />
      <DetailSection title="ที่อยู่ปัจจุบัน (กรณีต่างจากทะเบียนบ้าน)" items={address("current")} />
      <DetailSection title="ผู้ติดต่อฉุกเฉิน / ผู้ปกครอง" items={[
        ["ชื่อ–นามสกุลผู้ติดต่อ", value("emergency-name")], ["ความสัมพันธ์", value("emergency-relationship")], ["โทรศัพท์ผู้ติดต่อ", value("emergency-phone")],
      ]} />
      <DetailSection title="สิทธิการรักษา" items={[
        ["สิทธิการรักษา / การชำระเงิน", value("coverage")], ["หน่วยงาน / บริษัทประกัน / โรงพยาบาลตามสิทธิ", value("coverage-provider")],
      ]} />
    </div>
  </>;
}
