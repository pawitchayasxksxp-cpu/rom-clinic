import Link from "next/link";
import { UserRoundX } from "lucide-react";

export default function PatientNotFound() {
  return <section className="panel empty-state">
    <span className="empty-icon"><UserRoundX size={28} /></span>
    <h1>ไม่พบข้อมูลผู้ป่วย</h1>
    <p>กรุณาตรวจสอบรายชื่อและเลือกผู้ป่วยอีกครั้ง</p>
    <Link href="/registration" className="button button-secondary">กลับรายชื่อผู้ป่วย</Link>
  </section>;
}
