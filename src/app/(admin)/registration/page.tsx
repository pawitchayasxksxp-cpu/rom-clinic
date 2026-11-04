import { ClipboardPlus, Info, UserRound } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { departments } from "@/lib/navigation";
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
        description="ข้อมูลเบื้องต้นสำหรับผู้ป่วยที่เข้ารับบริการแบบ Walk-in"
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
          <form className="registration-form">
            <fieldset disabled>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="first-name">
                    ชื่อ <span>*</span>
                  </label>
                  <input id="first-name" placeholder="ชื่อผู้ป่วย" />
                </div>
                <div className="field">
                  <label htmlFor="last-name">
                    นามสกุล <span>*</span>
                  </label>
                  <input id="last-name" placeholder="นามสกุลผู้ป่วย" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="department">
                  แผนกที่เข้ารับบริการ <span>*</span>
                </label>
                <select id="department" defaultValue="">
                  <option value="" disabled>
                    เลือกแผนก
                  </option>
                  {departments.map((department) => (
                    <option key={department.code} value={department.code}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="symptoms">อาการเบื้องต้น</label>
                <textarea
                  id="symptoms"
                  rows={4}
                  placeholder="ระบุอาการหรือสาเหตุที่เข้ารับบริการ"
                />
              </div>
              <div className="field">
                <label>
                  ระดับความเร่งด่วน <span>*</span>
                </label>
                <div className="priority-options">
                  <label>
                    <input
                      type="radio"
                      name="priority"
                      value="normal"
                      defaultChecked
                    />
                    <span>
                      <strong>ปกติ</strong>
                      <small>เรียงตามเวลาที่ลงทะเบียน</small>
                    </span>
                  </label>
                  <label>
                    <input type="radio" name="priority" value="urgent" />
                    <span>
                      <strong>ด่วน</strong>
                      <small>รับบริการก่อนในแผนก</small>
                    </span>
                  </label>
                </div>
              </div>
              <button className="button button-primary" type="button" disabled>
                <ClipboardPlus size={18} />
                ยังไม่เปิดรับลงทะเบียน
              </button>
            </fieldset>
          </form>
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
                <p>กรอกข้อมูลและเลือกแผนก</p>
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
