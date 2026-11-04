import { Info, UserRound } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { PatientRegistrationForm } from "@/components/patient-registration-form";
import { ComingSoon, PageHeading } from "@/components/page-ui";

export const instant = false;
export const metadata = { title: "ลงทะเบียนผู้ป่วย | ROM Clinic" };
export default async function RegistrationPage() {
  await requireAdmin();
  return (
    <>
      <PageHeading
        eyebrow="PATIENT REGISTRATION"
        title="ลงทะเบียนผู้ป่วย"
        description="ข้อมูลทะเบียนผู้ป่วย ข้อมูลติดต่อ และการเข้ารับบริการ"
      >
        <ComingSoon />
      </PageHeading>
      <div className="form-columns">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>
                <UserRound size={19} />
                ข้อมูลผู้ป่วย
              </h2>
              <p>เตรียมข้อมูลให้พร้อมก่อนออกหมายเลขคิว</p>
            </div>
          </div>
          <PatientRegistrationForm />
        </section>
        <aside className="panel registration-guide">
          <div className="panel-header">
            <h2>ขั้นตอนรับบริการ</h2>
          </div>
          <ol className="steps">
            <li>
              <span>1</span>
              <div>
                <strong>ลงทะเบียนผู้ป่วย</strong>
                <p>ตรวจสอบตัวตน ข้อมูลติดต่อ และเลือกแผนก</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>รับหมายเลขคิว</strong>
                <p>หมายเลขแยกตามแผนก เช่น GN-001</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>รอเรียกเข้ารับบริการ</strong>
                <p>เจ้าหน้าที่เรียกคิวจากหน้าจัดการคิว</p>
              </div>
            </li>
          </ol>
          <div className="registration-reference">
            <h3>เอกสารที่ใช้ตรวจสอบ</h3>
            <p>บัตรประชาชนหรือหนังสือเดินทาง บัตรผู้ป่วยเดิม (ถ้ามี) และเอกสารสิทธิการรักษา</p>
            <h3>โครงสร้างแบบฟอร์มอ้างอิง</h3>
            <a href="https://hospital.wu.ac.th/wuhcare/Register/RegisterPatientHN" target="_blank" rel="noreferrer">โรงพยาบาลศูนย์การแพทย์มหาวิทยาลัยวลัยลักษณ์ ↗</a>
            <p>ปรับหมวดข้อมูลสำหรับ ROM Clinic โดยเพิ่มสิทธิการรักษาและข้อมูลเข้ารับบริการ</p>
          </div>
          <div className="info-note">
            <Info size={18} />
            <p>
              แบบฟอร์มอยู่ระหว่างเตรียมเปิดใช้งาน
              ข้อมูลผู้ป่วยยังไม่ถูกบันทึกในหน้านี้
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
