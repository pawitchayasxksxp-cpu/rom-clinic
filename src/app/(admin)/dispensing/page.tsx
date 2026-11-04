import { randomUUID } from "node:crypto";
import Link from "next/link";
import { Eye, Pill } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { listDispensing } from "@/lib/dispensing";
import { PageHeading } from "@/components/page-ui";
import { DispensingForm } from "@/components/dispensing-form";

export const instant = false;
export const metadata = { title: "จ่ายยา | ROM Clinic" };

export default async function DispensingPage() {
  const user = await requireAdmin();
  const records = await listDispensing();
  const date = new Intl.DateTimeFormat("th-TH", { dateStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date());
  return <>
    <PageHeading eyebrow="MEDICATION DISPENSING" title="จ่ายยา" description="เลือกผู้ป่วย กรอกข้อมูลการจ่ายยา และจัดทำฉลากยาสำหรับพิมพ์" />
    <DispensingForm dispensingKey={randomUUID()} date={date} defaultDispenser={user.name} />
    <section className="panel dispensing-recent"><div className="panel-header"><div><h2><Pill size={19} />รายการจ่ายยาล่าสุด</h2><p>แสดง 20 รายการล่าสุด เปิดดูหรือพิมพ์ฉลากซ้ำได้</p></div></div>
      {records.length ? <div className="patient-table-scroll"><table className="patient-table"><caption className="sr-only">รายการจ่ายยาล่าสุด</caption><thead><tr><th scope="col">วันที่จ่ายยา</th><th scope="col">ผู้ป่วย / HN</th><th scope="col">ชื่อยา</th><th scope="col">ฉลากยา</th></tr></thead><tbody>{records.map(record => <tr key={record.id}><td>{record.date}</td><td>{record.patient_name}<br />{record.hn}</td><td>{record.drug_name}</td><td><Link href={`/dispensing/${record.id}`} className="button button-secondary"><Eye size={17} />ดูฉลาก</Link></td></tr>)}</tbody></table></div> : <div className="empty-state"><h3>ยังไม่มีรายการจ่ายยา</h3><p>เลือกผู้ป่วยและกรอกฉลากยาเพื่อเริ่มบันทึก</p></div>}
    </section>
  </>;
}
