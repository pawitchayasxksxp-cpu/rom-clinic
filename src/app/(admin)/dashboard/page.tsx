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
} from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { departments } from "@/lib/navigation";
import { ComingSoon, EmptyState, PageHeading } from "@/components/page-ui";

export const instant = false;
export const metadata = { title: "ภาพรวม | ROM Clinic" };
export default async function DashboardPage() {
  const user = await requireAdmin();
  const date = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long",
    timeZone: "Asia/Bangkok",
  }).format(new Date());
  return (
    <>
      <PageHeading
        eyebrow="YOUR CLINIC AT A GLANCE"
        title="ภาพรวมคลินิก"
        description={`ยินดีต้อนรับ ${user.name} ดูแลวันทำงานของคุณให้ราบรื่น`}
      >
        <Link href="/registration" className="button button-primary">
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
        <ComingSoon />
      </div>
      <div className="stat-grid">
        {[
          {
            label: "ผู้ป่วยทั้งหมด",
            icon: UsersRound,
            color: "teal",
            detail: "ผู้ลงทะเบียนประจำวัน",
          },
          {
            label: "กำลังรอตรวจ",
            icon: Clock3,
            color: "amber",
            detail: "รอรับการเรียกคิว",
          },
          {
            label: "กำลังตรวจ",
            icon: Stethoscope,
            color: "blue",
            detail: "อยู่ระหว่างรับบริการ",
          },
          {
            label: "ตรวจเสร็จสิ้น",
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
              —<span>คน</span>
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
              <p>คิวด่วนจะแสดงก่อน ตามด้วยเวลาที่ลงทะเบียน</p>
            </div>
            <Link className="text-link" href="/queues">
              จัดการคิว
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="queue-table-head">
            <span>หมายเลขคิว / ผู้ป่วย</span>
            <span>แผนก</span>
            <span>สถานะ</span>
          </div>
          <EmptyState registration />
          <div className="panel-footnote">
            <span className="mini-dot rose" />
            คิวด่วนได้รับการจัดลำดับก่อนในแต่ละแผนก
          </div>
        </section>
        <section className="panel department-panel">
          <div className="panel-header">
            <div>
              <h2>แผนกให้บริการ</h2>
              <p>4 แผนก พร้อมดูแลผู้ป่วย</p>
            </div>
            <span className="count-badge">04</span>
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
                  —<small>รอตรวจ</small>
                </span>
              </div>
            ))}
          </div>
          <div className="department-note">
            <ArrowDownRight size={16} />
            <span>หมายเลขคิวแยกตามแผนก เช่น GN-001</span>
          </div>
        </section>
      </div>
      <div className="daily-note">
        <span className="daily-note-icon">
          <Clock3 size={20} />
        </span>
        <div>
          <strong>ทุกวัน เริ่มต้นด้วยการดูแลที่ดี</strong>
          <p>ระบบคิวและสถิติประจำวันอยู่ระหว่างเตรียมเปิดใช้งาน</p>
        </div>
        <Link href="/display">
          ไปยังจอแสดงคิว
          <ArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}
