import { randomUUID } from "node:crypto";
import { CourseManager } from "@/components/course-manager";
import { listCourses } from "@/lib/courses";
import { Building2, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { departments } from "@/lib/navigation";
import { PageHeading } from "@/components/page-ui";
import { AdminManager } from "@/components/admin-manager";
import { PasswordForm } from "@/components/password-form";

export const instant = false;
export const metadata = { title: "ตั้งค่าระบบ | ROM Clinic" };
export default async function SettingsPage() {
  const user = await requireAdmin();
  const courses = await listCourses();
  return (
    <>
      <PageHeading
        eyebrow="CLINIC SETTINGS"
        title="ตั้งค่าระบบ"
        description="จัดการบัญชีผู้ดูแลและตรวจสอบข้อมูลพื้นฐานของคลินิก"
      />
      <div className="settings-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>
                <ShieldCheck size={19} />
                บัญชีผู้ดูแลระบบ
              </h2>
              <p>ข้อมูลบัญชีที่คุณกำลังใช้งาน</p>
            </div>
            <span className="badge badge-teal">Admin</span>
          </div>
          <dl className="details-list">
            <div>
              <dt>ชื่อผู้ใช้งาน</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>อีเมล</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>สิทธิ์การใช้งาน</dt>
              <dd>ผู้ดูแลระบบ</dd>
            </div>
          </dl>
          <div className="password-section">
            <h3>เปลี่ยนรหัสผ่าน</h3>
            <PasswordForm />
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>
                <Building2 size={19} />
                ข้อมูลคลินิก
              </h2>
              <p>การให้บริการในเฟสแรก</p>
            </div>
          </div>
          <dl className="details-list">
            <div>
              <dt>ชื่อระบบ</dt>
              <dd>ROM Clinic</dd>
            </div>
            <div>
              <dt>รูปแบบบริการ</dt>
              <dd>Walk-in</dd>
            </div>
            <div>
              <dt>เขตเวลา</dt>
              <dd>ประเทศไทย (UTC+7)</dd>
            </div>
          </dl>
          <div className="settings-departments">
            <h3>แผนกให้บริการ</h3>
            {departments.map((item) => (
              <div key={item.code}>
                <span className={`department-code ${item.className}`}>
                  {item.code}
                </span>
                <strong>{item.name}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
      <CourseManager courses={courses} newId={randomUUID()} />
      <AdminManager />
    </>
  );
}
