import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  CheckCheck,
  Clock3,
  ListOrdered,
  Plus,
  Stethoscope,
  UsersRound,
  XCircle,
} from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { departments, departmentName } from "@/lib/navigation";
import { DashboardRefresh } from "@/components/dashboard-refresh";
import { bangkokToday } from "@/lib/calendar";
import { listBookings } from "@/lib/bookings";
import { EmptyState, PageHeading } from "@/components/page-ui";

export const instant = false;
export const metadata = { title: "ภาพรวม | ROM Clinic" };
export default async function DashboardPage() {
  const user = await requireAdmin();
  const today = bangkokToday();
  const end = new Date(`${today}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  const bookings = await listBookings(today, end.toISOString().slice(0, 10), "");
  const waiting = bookings.filter(item => item.status === "confirmed");
  const date = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long",
    timeZone: "Asia/Bangkok",
  }).format(new Date());
  return (
    <>
      <DashboardRefresh />
      <PageHeading
        eyebrow="YOUR CLINIC AT A GLANCE"
        title="ภาพรวมคลินิก"
        description={`ยินดีต้อนรับ ${user.name} ดูแลวันทำงานของคุณให้ราบรื่น`}
      >
        <Link href="/registration/new" className="button button-primary">
          <Plus size={18} />
          ลงทะเบียนผู้ป่วย
        </Link>
      </PageHeading>
      <div className="welcome-banner">
        <div>
          <span className="badge badge-white">
            <span className="status-dot" />
            พื้นที่ทำงานของคุณ
          </span>
          <h2>พร้อมดูแล ในทุกการรอคอย</h2>
          <p>ติดตามผู้ป่วยและคิวของแต่ละแผนกได้จากที่เดียว</p>
          <span className="welcome-date">{date}</span>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <span className="welcome-art-circle" />
          <Stethoscope size={92} strokeWidth={1.1} />
          <span className="art-plus">+</span>
          <span className="art-dot" />
        </div>
      </div>
      <div className="section-label">
        <h2>สรุปการให้บริการวันนี้</h2>
        <span className="badge badge-teal">นัดหมายจากปฏิทิน</span>
      </div>
      <div className="stat-grid">
        {[
          {
            label: "นัดหมายทั้งหมด",
            value: bookings.length,
            icon: UsersRound,
            color: "teal",
            detail: "นัดหมายวันนี้จากปฏิทิน",
          },
          {
            label: "รอรับบริการ",
            value: waiting.length,
            icon: Clock3,
            color: "amber",
            detail: "นัดที่ยืนยันและยังไม่เสร็จสิ้น",
          },
          {
            label: "ยกเลิกนัด",
            value: bookings.filter(item => item.status === "cancelled").length,
            icon: XCircle,
            color: "blue",
            detail: "รายการนัดที่ยกเลิกแล้ว",
          },
          {
            label: "รับบริการเสร็จสิ้น",
            value: bookings.filter(item => item.status === "completed").length,
            icon: CheckCheck,
            color: "green",
            detail: "รับบริการเรียบร้อยแล้ว",
          },
        ].map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className="stat-label">
              {stat.label}
              <span className={`stat-icon ${stat.color}`}>
                <stat.icon size={19} />
              </span>
            </div>
            <div className="stat-value">
              {stat.value}<span>รายการ</span>
            </div>
            <div className="stat-caption">
              <span className={`mini-dot ${stat.color}`} />
              {stat.detail}
            </div>
          </article>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>
                <ListOrdered size={19} />
                คิวรอรับบริการ
              </h2>
              <p>นัดหมายวันนี้จากปฏิทิน เรียงตามเวลานัด</p>
            </div>
            <Link className="text-link" href={`/calendar?date=${today}`}>
              ดูปฏิทิน
              <ArrowRight size={16} />
            </Link>
          </div>
          {waiting.length ? <div className="patient-table-scroll"><table className="patient-table dashboard-waiting-table"><caption className="sr-only">คิวรอรับบริการจากนัดหมายวันนี้</caption><thead><tr><th scope="col">เวลานัด / ผู้ป่วย</th><th scope="col">แผนก</th><th scope="col">สถานะ</th></tr></thead><tbody>{waiting.map(booking => <tr key={booking.id}><td><strong className="dashboard-booking-time">{booking.time}</strong><Link href={`/registration/${booking.patient_id}`}>{booking.patient_name}</Link><small>{booking.hn}</small></td><td>{departmentName(booking.department)}</td><td><span className="badge badge-teal">รอรับบริการ</span></td></tr>)}</tbody></table></div> : <EmptyState title="ไม่มีนัดหมายรอรับบริการวันนี้" description="นัดหมายที่ยืนยันในปฏิทินของวันนี้จะแสดงที่นี่" />}
          <div className="panel-footnote"><span className="mini-dot teal" />แสดงนัดวันนี้ตามเวลาไทย ยกเว้นรายการยกเลิกหรือเสร็จสิ้นแล้ว</div>
        </section>
        <section className="panel department-panel">
          <div className="panel-header">
            <div>
              <h2>แผนกให้บริการ</h2>
              <p>{departments.length} แผนก พร้อมดูแลผู้ป่วย</p>
            </div>
            <span className="count-badge">{String(departments.length).padStart(2, "0")}</span>
          </div>
          <div className="department-list">
            {departments.map((department) => (
              <div className="department-row" key={department.code}>
                <span className={`department-code ${department.className}`}>
                  {department.code}
                </span>
                <div>
                  <strong>{department.name}</strong>
                  <small>{department.caption}</small>
                </div>
                <span className="department-count">
                  {waiting.filter(item => item.department === department.code).length}<small>รอรับบริการ</small>
                </span>
              </div>
            ))}
          </div>
          <div className="department-note">
            <ArrowDownRight size={16} />
            <span>จำนวนรายการนัดวันนี้ที่ยังรอรับบริการ</span>
          </div>
        </section>
      </div>
      <div className="daily-note">
        <span className="daily-note-icon">
          <Clock3 size={20} />
        </span>
        <div>
          <strong>ทุกวัน เริ่มต้นด้วยการดูแลที่ดี</strong>
          <p>ข้อมูลนัดหมายจากปฏิทิน อัปเดตอัตโนมัติทุก 30 วินาที</p>
        </div>
        <Link href={`/calendar?date=${today}`}>
          ไปยังปฏิทินการจอง
          <ArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}
