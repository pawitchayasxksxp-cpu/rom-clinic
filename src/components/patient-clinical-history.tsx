import Link from "next/link";
import { FilePlus2, FileText, Plus } from "lucide-react";
import { patientHistory } from "@/lib/clinical";
import { departmentName } from "@/lib/navigation";

export async function PatientClinicalHistory({ patientId, page, query = "" }: { patientId: string; page: number; query?: string }) {
  const { events, hasNext } = await patientHistory(patientId, page);
  const historyUrl = (target: number) => {
    const params = new URLSearchParams(query); params.set("history-page", String(target));
    return `/registration/${patientId}?${params}#treatment-history`;
  };
  return <section className="panel patient-history" id="treatment-history" aria-label="ประวัติการรักษา">
    <div className="panel-header"><div><h2><FileText size={19} />ประวัติการรักษา</h2><p>บันทึกการตรวจ การจ่ายยา และใบรับรองแพทย์ เรียงจากล่าสุด</p></div><div className="registration-action-buttons"><Link href={`/registration/${patientId}/treatments/new`} className="button button-primary"><Plus size={17} />บันทึกการรักษา</Link><Link href={`/registration/${patientId}/certificates/new`} className="button button-secondary"><FilePlus2 size={17} />ออกใบรับรองแพทย์</Link></div></div>
    {events.length ? <ol className="clinical-timeline">{events.map(event => <li key={`${event.kind}-${event.id}`}>
      <div className="clinical-event-heading"><strong>{event.kind === "treatment" ? "รับการรักษา" : event.kind === "dispensing" ? "จ่ายยา" : event.kind === "body-chart" ? "Body Chart" : "ใบรับรองแพทย์"}</strong><time>{event.date}</time>{event.department && <span className="badge badge-teal">{departmentName(event.department)}</span>}</div>
      {event.kind === "treatment" ? <dl className="clinical-event-data">
        {[["อาการ", "symptoms"], ["ผลตรวจ", "examination"], ["การประเมิน / การวินิจฉัย", "assessment"], ["การรักษา / คำแนะนำ", "treatment"], ["ผู้ให้บริการ", "provider"], ["วันติดตามอาการ (ค.ศ.)", "follow-up"]].map(([label, key]) => event.details[key] && <div key={key}><dt>{label}</dt><dd>{event.details[key]}</dd></div>)}
        {(event.details["bp-systolic"] || event.details.pulse) && <div><dt>สัญญาณชีพ</dt><dd>{event.details["bp-systolic"] && `ความดัน ${event.details["bp-systolic"]}/${event.details["bp-diastolic"]} mmHg`}{event.details.pulse && ` · ชีพจร ${event.details.pulse} ครั้ง/นาที`}</dd></div>}
      </dl> : event.kind === "dispensing" ? <div className="clinical-event-summary"><p>{event.details["drug-name"]} · จำนวน {event.details.quantity} {event.details.unit === "อื่น ๆ" ? event.details["unit-other"] || event.details.unit : event.details.unit}</p><p>{event.details.directions}</p><Link href={`/dispensing/${event.id}`} className="text-link">เปิดฉลากยา</Link></div> : event.kind === "certificate" ? <div className="clinical-event-summary"><p>{event.details.number} · ผู้รับรอง {event.details.provider}</p><Link href={`/certificates/${event.id}`} className="text-link">เปิดใบรับรองแพทย์ / พิมพ์ซ้ำ</Link></div> : <div className="clinical-event-summary"><p>{event.details["chart-date"]} · {event.details.count} จุด · ผู้บันทึก {event.details.provider}</p><Link href={`/body-charts/${event.id}`} className="text-link">เปิด Body Chart</Link></div>}
    </li>)}</ol> : <div className="empty-state"><h3>ยังไม่มีประวัติการรักษา</h3><p>บันทึกการรักษาหรือจ่ายยาเพื่อเริ่มเก็บประวัติของผู้ป่วยคนนี้</p></div>}
    {(page > 1 || hasNext) && <nav className="patient-pagination" aria-label="หน้าประวัติการรักษา">{page > 1 && <Link href={historyUrl(page - 1)} className="button button-secondary">ประวัติก่อนหน้า</Link>}<span>หน้า {page}</span>{hasNext && <Link href={historyUrl(page + 1)} className="button button-secondary">ประวัติถัดไป</Link>}</nav>}
  </section>;
}
