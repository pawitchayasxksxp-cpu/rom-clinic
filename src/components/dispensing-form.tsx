"use client";

import { startTransition, useActionState, useState } from "react";
import { Printer, Save } from "lucide-react";
import { PatientPicker } from "./patient-picker";
import { DrugLabel } from "./drug-label";
import type { Medicine } from "@/lib/medicines";
import { emptyDrugLabel, type DrugLabelData } from "@/lib/dispensing-validation";
import type { PatientChoice } from "@/lib/patients";
import { saveDispensing } from "@/app/(admin)/dispensing/actions";

export function DispensingForm({ dispensingKey, date, defaultDispenser, medicines }: { dispensingKey: string; date: string; defaultDispenser: string; medicines: Medicine[] }) {
  const [data, setData] = useState<DrugLabelData>({ ...emptyDrugLabel, dispenser: defaultDispenser });
  const [patient, setPatient] = useState<PatientChoice | null>(null);
  const [state, action, pending] = useActionState(saveDispensing, { error: "" });
  const update = (key: keyof DrugLabelData, value: string) => setData(previous => ({ ...previous, [key]: value }));
  const input = (key: keyof DrugLabelData, label: string, required = false, type = "text") => <div className="field" key={key}><label htmlFor={`drug-${key}`}>{label}{required && <span> *</span>}</label><input id={`drug-${key}`} name={key} type={type} value={data[key]} onChange={event => update(key, event.target.value)} required={required} maxLength={200} min={type === "number" ? "0.01" : type === "date" ? "1900-01-01" : undefined} max={type === "number" ? "999999.99" : type === "date" ? "2100-12-31" : undefined} step={type === "number" ? "0.01" : undefined} /></div>;
  const [medicineId, setMedicineId] = useState("");
  const medicine = medicines.find(item => item.id === medicineId);
  const textarea = (key: keyof DrugLabelData, label: string, required = false) => <div className="field" key={key}><label htmlFor={`drug-${key}`}>{label}{required && <span> *</span>}</label><textarea id={`drug-${key}`} name={key} value={data[key]} onChange={event => update(key, event.target.value)} required={required} maxLength={1000} rows={3} /></div>;
  return <div className="dispensing-layout">
    <section className="panel dispensing-entry"><div className="panel-header"><div><h2>ข้อมูลการจ่ายยา</h2><p>กรอกข้อมูลตามคำสั่งผู้สั่งใช้ยา แล้วตรวจสอบฉลากก่อนบันทึก</p></div></div>
      <form className="registration-form" onSubmit={event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        if (submitter instanceof HTMLButtonElement && submitter.dataset.print === "true") form.set("print-after-save", "1");
        startTransition(() => action(form));
      }} aria-busy={pending}>
        <input type="hidden" name="dispensing-key" value={dispensingKey} />
        <fieldset disabled={pending}>
          <PatientPicker idPrefix="dispensing" listLabel="รายชื่อผู้ป่วยสำหรับจ่ายยา" onSelect={setPatient} />
          <div className="field-grid"><div className="field"><label htmlFor="drug-medicine">ชื่อยา *</label><select id="drug-medicine" name="medicine-id" required value={medicineId} onChange={event => { const item = medicines.find(m => m.id === event.target.value); setMedicineId(event.target.value); setData(previous => ({...previous, "drug-name":item?.name || "", strength:item?.dosage_form || "", "strength-other":item?.form_other || "", unit:item?.unit || "", "unit-other":item?.unit_other || ""})); }}><option value="" disabled>เลือกยาจาก Master Data</option>{medicines.map(item => <option key={item.id} value={item.id} disabled={Number(item.stock) <= 0}>{item.name} · คงเหลือ {item.stock} {item.unit === "อื่น ๆ" ? item.unit_other : item.unit}</option>)}</select>{!medicines.length && <p>กรุณาเพิ่มยาใน Master Data ก่อนจ่ายยา</p>}</div><div className="field"><label>รูปแบบยา / หน่วย</label><p>{medicine ? `${medicine.dosage_form === "อื่น ๆ" ? medicine.form_other : medicine.dosage_form} / ${medicine.unit === "อื่น ๆ" ? medicine.unit_other : medicine.unit}` : "—"}</p></div>{input("quantity", "จำนวนที่จ่าย", true, "number")}</div>
          {textarea("directions", "วิธีใช้ยา / ขนาดใช้ / ความถี่", true)}
          {textarea("indication", "ข้อบ่งใช้")}
          {textarea("warnings", "คำเตือน / ข้อควรระวัง")}
          {textarea("storage", "การเก็บรักษา")}
          <div className="field-grid">{input("expiry", "วันหมดอายุ (ค.ศ.)", false, "date")}{input("dispenser", "ผู้จ่ายยา", true)}</div>
          {state.error && <p className="form-error" role="alert">{state.error}</p>}
          <div className="registration-action-buttons"><button type="submit" data-print="true" className="button button-primary" disabled={pending}><Printer size={18} />สั่งพิมพ์ฉลาก</button>
          <button type="submit" className="button button-secondary" disabled={pending}><Save size={18} />{pending ? "กำลังบันทึก…" : "บันทึกและเปิดฉลากยา"}</button></div>
        </fieldset>
      </form>
    </section>
    <aside className="panel dispensing-preview"><div className="panel-header"><h2>ตัวอย่างฉลากยา</h2></div><div className="drug-label-wrap"><DrugLabel data={data} patientName={patient ? `${patient.first_name} ${patient.last_name}` : ""} hn={patient?.hn || ""} date={date} /></div><p className="dispensing-hint">ตัวอย่างจะเปลี่ยนตามที่กรอก บันทึกแล้วจึงเปิดพิมพ์ฉลากได้</p></aside>
  </div>;
}
