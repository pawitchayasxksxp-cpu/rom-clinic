import { ClinicLogo } from "./clinic-logo";
import type { Certificate } from "@/lib/clinical";
function dateLabel(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}
export function MedicalCertificate({ certificate }: { certificate: Certificate }) {
  const data = certificate.details;
  const patient = certificate.snapshot;
  return <article className="medical-certificate" aria-label="ใบรับรองแพทย์">
    <header><ClinicLogo size={64} /><strong>{data.facility}</strong>{data["facility-address"] && <p>{data["facility-address"]}</p>}<h2>ใบรับรองแพทย์</h2></header>
    <div className="certificate-meta"><span>เลขที่ {certificate.number}</span><span>วันที่ {dateLabel(data["issue-date"])}</span></div>
    <section><h3>ข้อมูลผู้รับการตรวจ</h3><p>ชื่อ–นามสกุล <strong>{patient.name}</strong></p><p>เลขประจำตัวผู้ป่วย (HN) {patient.hn}</p><p>วันเดือนปีเกิด {dateLabel(patient.birthDate)}</p>{patient.identity && <p>เลขที่เอกสารประจำตัว {patient.identity}</p>}{patient.address && <p>ที่อยู่ {patient.address}</p>}</section>
    <section><h3>ข้อมูลการตรวจ</h3><p>วันที่ตรวจ {dateLabel(data["exam-date"])}</p><h4>ผลการตรวจ / การวินิจฉัย</h4><p>{data.examination}</p><h4>ความเห็น / คำแนะนำของผู้ตรวจ</h4><p>{data.opinion}</p>{data["rest-from"] && <p className="certificate-rest">ให้พักตั้งแต่วันที่ {dateLabel(data["rest-from"])} ถึงวันที่ {dateLabel(data["rest-until"])}</p>}</section>
    <footer className="certificate-signature"><p>ลงชื่อ ........................................................ ผู้ตรวจ / ผู้รับรอง</p><p>({data.provider})</p>{data.profession && <p>{data.profession}</p>}<p>เลขใบอนุญาตประกอบวิชาชีพ {data.license}</p><p>วันที่ลงนาม ........................................................</p></footer>
  </article>;
}
