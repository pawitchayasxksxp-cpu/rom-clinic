"use client";

import { startTransition, useActionState } from "react";
import Link from "next/link";
import { registerPatient } from "@/app/(admin)/registration/actions";
import { ClipboardPlus } from "lucide-react";
import { departments } from "@/lib/navigation";

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  options?: readonly string[];
  autoComplete?: string;
  maxLength?: number;
};

function Field({ id, label, required, type = "text", placeholder, options, autoComplete, maxLength }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}{required && <span> *</span>}</label>
      {options ? (
        <select id={id} name={id} required={required} defaultValue="">
          <option value="" disabled>เลือก{label}</option>
          {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input id={id} name={id} type={type} min={type === "date" ? "1850-01-01" : undefined} placeholder={placeholder} required={required} autoComplete={autoComplete} maxLength={maxLength} />
      )}
    </div>
  );
}

function AddressFields({ prefix }: { prefix: string }) {
  return (
    <>
      <Field id={`${prefix}-line`} label="บ้านเลขที่ หมู่ อาคาร ซอย ถนน" autoComplete="address-line1" />
      <div className="field-grid">
        <Field id={`${prefix}-subdistrict`} label="ตำบล / แขวง" />
        <Field id={`${prefix}-district`} label="อำเภอ / เขต" autoComplete="address-level2" />
        <Field id={`${prefix}-province`} label="จังหวัด" autoComplete="address-level1" />
        <Field id={`${prefix}-postal-code`} label="รหัสไปรษณีย์" autoComplete="postal-code" maxLength={5} />
      </div>
    </>
  );
}

export function PatientRegistrationForm({ registrationKey }: { registrationKey: string }) {
  const [state, action, pending] = useActionState(registerPatient, { error: "" });
  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      startTransition(() => action(data));
    }} className="registration-form hospital-registration" aria-describedby="registration-status" aria-busy={pending}>
      <input type="hidden" name="registration-key" value={registrationKey} />
      <p className="registration-intro">แบบฟอร์มทะเบียนผู้ป่วย <span>* ข้อมูลจำเป็น</span></p>
      <fieldset disabled={pending}>
        <legend><span>01</span> ข้อมูลส่วนตัวผู้ป่วย</legend>
        <div className="field-grid">
          <Field id="patient-type" label="ประเภทผู้ป่วย" required options={["ผู้ป่วยใหม่", "ผู้ป่วยเดิม"]} />
          <Field id="hn" label="เลขประจำตัวผู้ป่วย (HN)" placeholder="สำหรับผู้ป่วยที่มี HN แล้ว" />
          <Field id="identity-type" label="ประเภทเอกสารยืนยันตัวตน" options={["บัตรประชาชน", "หนังสือเดินทาง", "เอกสารอื่น / ไม่มีเอกสาร"]} />
          <Field id="identity-number" label="เลขที่เอกสารยืนยันตัวตน" placeholder="เลขบัตรประชาชน หรือหนังสือเดินทาง" maxLength={30} />
          <Field id="title" label="คำนำหน้าชื่อ" options={["นาย", "นาง", "นางสาว", "เด็กชาย", "เด็กหญิง", "อื่น ๆ"]} />
          <Field id="first-name" label="ชื่อ" required autoComplete="given-name" />
          <Field id="last-name" label="นามสกุล" required autoComplete="family-name" />
          <Field id="birth-date" label="วันเดือนปีเกิด (ค.ศ.)" required type="date" autoComplete="bday" />
          <Field id="sex" label="เพศ" options={["ชาย", "หญิง", "อื่น ๆ", "ไม่ประสงค์ระบุ"]} />
          <Field id="nationality" label="สัญชาติ" placeholder="เช่น ไทย" />
          <Field id="marital-status" label="สถานภาพสมรส" options={["โสด", "สมรส", "หย่า", "หม้าย", "แยกกันอยู่", "ไม่ประสงค์ระบุ"]} />
          <Field id="occupation" label="อาชีพ" />
          <Field id="phone" label="โทรศัพท์ผู้ป่วย / ผู้ปกครอง" required type="tel" autoComplete="tel" maxLength={20} />
          <Field id="email" label="อีเมล (ถ้ามี)" type="email" autoComplete="email" />
        </div>
      </fieldset>
      <fieldset disabled={pending}>
        <legend><span>02</span> ที่อยู่และช่องทางติดต่อ</legend>
        <h3 className="registration-subheading">ที่อยู่ตามทะเบียนบ้าน</h3>
        <AddressFields prefix="registered" />
        <details className="registration-address">
          <summary>ที่อยู่ปัจจุบัน (กรณีต่างจากทะเบียนบ้าน)</summary>
          <AddressFields prefix="current" />
        </details>
      </fieldset>
      <fieldset disabled={pending}>
        <legend><span>03</span> ผู้ติดต่อฉุกเฉิน / ผู้ปกครอง</legend>
        <div className="field-grid">
          <Field id="emergency-name" label="ชื่อ–นามสกุลผู้ติดต่อ" />
          <Field id="emergency-relationship" label="ความสัมพันธ์กับผู้ป่วย" options={["บิดา", "มารดา", "คู่สมรส", "บุตร", "ญาติ", "ผู้ปกครอง", "อื่น ๆ"]} />
          <Field id="emergency-phone" label="โทรศัพท์ผู้ติดต่อ" type="tel" maxLength={20} />
        </div>
      </fieldset>
      <fieldset disabled={pending}>
        <legend><span>04</span> สิทธิการรักษา</legend>
        <div className="field-grid">
          <Field id="coverage" label="สิทธิการรักษา / การชำระเงิน" options={["ยังไม่ตรวจสอบสิทธิ", "ชำระเงินเอง", "หลักประกันสุขภาพแห่งชาติ", "ประกันสังคม", "ข้าราชการ / รัฐวิสาหกิจ", "ประกันสุขภาพเอกชน", "อื่น ๆ"]} />
          <Field id="coverage-provider" label="หน่วยงาน / บริษัทประกัน / โรงพยาบาลตามสิทธิ" />
        </div>
        <p className="form-note">เจ้าหน้าที่ตรวจสอบสิทธิและเอกสารก่อนเข้ารับบริการ</p>
      </fieldset>
      <fieldset disabled={pending}>
        <legend><span>05</span> ข้อมูลสุขภาพเบื้องต้นและการรับบริการ</legend>
        <div className="field-grid">
          <Field id="blood-group" label="หมู่เลือด" options={["ไม่ทราบ", "A", "B", "AB", "O"]} />
          <Field id="allergy-status" label="ประวัติแพ้ยา / อาหาร" options={["ไม่ทราบ / ยังไม่ยืนยัน", "ผู้ป่วยแจ้งว่าไม่มีประวัติแพ้", "มีประวัติแพ้ (ระบุรายละเอียดด้านล่าง)"]} />
        </div>
        <div className="field">
          <label htmlFor="allergy-details">สิ่งที่แพ้และอาการแพ้</label>
          <textarea id="allergy-details" name="allergy-details" rows={2} placeholder="ชื่อยา / อาหาร และอาการที่เคยเกิดขึ้น" />
        </div>
        <Field id="conditions" label="โรคประจำตัว / ยาที่ใช้ประจำ" placeholder="ระบุตามข้อมูลที่ผู้ป่วยแจ้ง" />
        <div className="field">
          <label htmlFor="department">แผนกที่เข้ารับบริการ <span>*</span></label>
          <select id="department" name="department" required defaultValue="">
            <option value="" disabled>เลือกแผนก</option>
            {departments.map(department => <option key={department.code} value={department.code}>{department.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="symptoms">อาการสำคัญ / เหตุผลที่มารับบริการ</label>
          <textarea id="symptoms" name="symptoms" rows={3} placeholder="ระบุอาการและระยะเวลาที่เป็น" />
        </div>
        <fieldset className="registration-priority">
          <legend>ระดับความเร่งด่วน</legend>
          <div className="priority-options">
            <label><input type="radio" name="priority" value="normal" defaultChecked /><span><strong>ปกติ</strong><small>เรียงตามเวลาที่ลงทะเบียน</small></span></label>
            <label><input type="radio" name="priority" value="urgent" /><span><strong>ด่วน</strong><small>เจ้าหน้าที่ระบุตามผลคัดกรอง</small></span></label>
          </div>
        </fieldset>
      </fieldset>
      <div className="registration-actions">
        <p id="registration-status">บันทึกข้อมูลเข้ารายชื่อผู้ป่วย การออกหมายเลขคิวจะเปิดใช้งานในขั้นตอนถัดไป</p>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        <div className="registration-action-buttons">
          <button className="button button-primary" type="submit" disabled={pending}><ClipboardPlus size={18} />{pending ? "กำลังบันทึก…" : "บันทึกผู้ป่วย"}</button>
          <Link href="/registration" className="button button-secondary">ยกเลิก</Link>
        </div>
      </div>
    </form>
  );
}
