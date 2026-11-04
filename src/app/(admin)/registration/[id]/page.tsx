import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, HeartPulse, UserRound } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getPatient } from "@/lib/patients";
import { patientServiceLabel } from "@/lib/patient-service";
import { departmentName } from "@/lib/navigation";
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
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();
  const query = await searchParams;
  const backParams = new URLSearchParams();
  if (typeof query.q === "string" && query.q) backParams.set("q", query.q.slice(0, 100));
  if (typeof query.page === "string" && /^[1-9]\d{0,5}$/.test(query.page)) backParams.set("page", query.page);
  const backUrl = `/registration${backParams.size ? `?${backParams}` : ""}`;
  const value = (key: string) => typeof patient.details?.[key] === "string" ? (patient.details[key] as string) : "";
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
    <PageHeading eyebrow="PATIENT DETAILS" title="รายละเอียดผู้ป่วย" description={`HN ${patient.hn} · ลงทะเบียน ${patient.registered_date}`}>
      <Link href={backUrl} className="button button-secondary"><ArrowLeft size={18} />กลับรายชื่อผู้ป่วย</Link>
    </PageHeading>
    <section className="panel patient-profile" aria-label="ข้อมูลสรุปผู้ป่วย">
      <div className="patient-profile-name"><span className="empty-icon"><UserRound size={28} /></span><div><h2>{value("title")} {patient.first_name} {patient.last_name}</h2><p>{patient.hn} · แผนก{department}</p></div></div>
      <dl className="patient-vitals">
        <div><dt><HeartPulse size={17} />ความดัน</dt><dd>{bp} <small>mmHg</small></dd></div>
        <div><dt>ชีพจร</dt><dd>{value("pulse") || "—"} <small>ครั้ง/นาที</small></dd></div>
        <div><dt>หมู่เลือด</dt><dd>{value("blood-group") || "—"}</dd></div>
      </dl>
    </section>
    <div className="patient-detail-grid">
      <DetailSection title="ข้อมูลส่วนตัวและการติดต่อ" items={[
        ["เลขประจำตัวผู้ป่วย (HN)", patient.hn], ["ประเภทผู้ป่วย", value("patient-type")], ["ประเภทบริการ", patientServiceLabel(value("service-type"))],
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
        ["ชีพจร (ครั้ง/นาที)", value("pulse")],
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
