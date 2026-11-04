"use client";
import { startTransition, useActionState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { departments } from "@/lib/navigation";
import { saveCertificate, saveTreatment } from "@/app/(admin)/registration/clinical-actions";

export function ClinicalForm({ mode, patientId, recordKey, date, time, provider, professional }: {
  mode: "treatment" | "certificate"; patientId: string; recordKey: string; date: string; time: string; provider: string; professional?: Record<string, string>;
}) {
  const treatment = mode === "treatment";
  const [state, action, pending] = useActionState(async (previous: { error: string }, data: FormData) => treatment ? saveTreatment(previous, data) : saveCertificate(previous, data), { error: "" });
  const field = (id: string, label: string, options: { required?: boolean; type?: string; value?: string; min?: string; max?: string } = {}) => <div className="field" key={id}><label htmlFor={id}>{label}{options.required && <span> *</span>}</label><input id={id} name={id} type={options.type || "text"} required={options.required} defaultValue={options.value || ""} maxLength={254} min={options.min} max={options.max} step={options.type === "number" ? "1" : undefined} /></div>;
  const text = (id: string, label: string, required = false) => <div className="field" key={id}><label htmlFor={id}>{label}{required && <span> *</span>}</label><textarea id={id} name={id} required={required} maxLength={4000} rows={4} /></div>;
  return <form className="registration-form clinical-form" onSubmit={event => {
    event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => action(data));
  }} aria-busy={pending}>
    <input type="hidden" name="patient-id" value={patientId} /><input type="hidden" name="record-key" value={recordKey} />
    <fieldset disabled={pending}>
      {treatment ? <>
        <div className="field-grid">{field("visit-date", "วันที่รับบริการ (ค.ศ.)", { required: true, type: "date", value: date, max: date })}{field("visit-time", "เวลารับบริการ (เวลาไทย)", { required: true, type: "time", value: time })}</div>
        <div className="field"><label htmlFor="department">แผนก <span>*</span></label><select id="department" name="department" required defaultValue=""><option value="" disabled>เลือกแผนก</option>{departments.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>
        <section id="visit-vitals" className="visit-vitals-entry" aria-label="สัญญาณชีพในการรักษาครั้งนี้"><h2>ความดันและชีพจรครั้งนี้</h2><p className="form-note">กรอกค่าที่วัดใหม่ในการมารักษาครั้งนี้ ระบบเก็บแยกตามวันที่และเวลารับบริการในประวัติการรักษา</p>
        <div className="field-grid">{field("bp-systolic", "ความดันตัวบน (mmHg)", { type: "number", min: "1", max: "999" })}{field("bp-diastolic", "ความดันตัวล่าง (mmHg)", { type: "number", min: "1", max: "999" })}{field("pulse", "ชีพจร (ครั้ง/นาที)", { type: "number", min: "1", max: "999" })}</div>
        </section>
        {text("symptoms", "อาการสำคัญ / เหตุผลที่มารับบริการ", true)}
        {text("examination", "ผลการตรวจ")}{text("assessment", "การประเมิน / การวินิจฉัย")}{text("treatment", "การรักษา / หัตถการ / คำแนะนำ", true)}
        <div className="field-grid">{field("provider", "ผู้ให้บริการ", { required: true, value: provider })}{field("follow-up", "วันติดตามอาการ (ถ้ามี)", { type: "date" })}</div>
      </> : <>
        <div className="field-grid">{field("issue-date", "วันที่ออกเอกสาร (ค.ศ.)", { required: true, type: "date", value: date, max: date })}{field("exam-date", "วันที่ตรวจ (ค.ศ.)", { required: true, type: "date", value: date, max: date })}</div>
        {field("facility", "สถานพยาบาล / สถานที่ออกเอกสาร", { required: true, value: "ROM Clinic" })}{text("facility-address", "ที่อยู่สถานพยาบาล")}
        {text("examination", "ผลการตรวจ / การวินิจฉัย", true)}{text("opinion", "ความเห็น / คำแนะนำของผู้ตรวจ", true)}
        <div className="field-grid">{field("rest-from", "ให้พักตั้งแต่วันที่ (ถ้ามี)", { type: "date" })}{field("rest-until", "ถึงวันที่ (ถ้ามี)", { type: "date" })}</div>
        <div className="field-grid">{field("provider", "ชื่อผู้ตรวจ / ผู้รับรอง", { required: true, value: professional?.["license-name"] })}{field("profession", "ตำแหน่ง / วิชาชีพ", { value: professional?.profession === "อื่น ๆ" ? professional["profession-other"] : professional?.profession })}{field("license", "เลขใบอนุญาตประกอบวิชาชีพ", { required: true, value: professional?.["license-number"] })}</div>
        <p className="form-note">บันทึกข้อมูลแล้วเปิดพิมพ์ เพื่อให้ผู้ตรวจตรวจสอบและลงนามในเอกสาร</p>
      </>}
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <div className="registration-action-buttons"><button type="submit" className="button button-primary" disabled={pending}><Save size={18} />{pending ? "กำลังบันทึก…" : treatment ? "บันทึกประวัติการรักษา" : "บันทึกและเปิดใบรับรองแพทย์"}</button><Link href={`/registration/${patientId}`} className="button button-secondary">ยกเลิก</Link></div>
    </fieldset>
  </form>;
}
