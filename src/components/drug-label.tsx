import { medicationForms } from "@/lib/medication-options";
import { ClinicLogo } from "./clinic-logo";
import type { DrugLabelData } from "@/lib/dispensing-validation";

export function DrugLabel({ data, patientName, hn, date }: { data: DrugLabelData; patientName: string; hn: string; date: string }) {
  const isDosageForm = medicationForms.some(option => option === data.strength);
  const formLabel = data.strength === "อื่น ๆ" ? data["strength-other"] || data.strength : data.strength;
  const unitLabel = data.unit === "อื่น ๆ" ? data["unit-other"] || data.unit : data.unit;
  return <article className="drug-label" aria-label="ฉลากยา">
    <header><span className="document-clinic-brand"><ClinicLogo size={44} /><strong>ROM Clinic</strong></span><span>ฉลากยา</span></header>
    <div className="drug-label-patient"><strong>{patientName || "ชื่อผู้ป่วย"}</strong><span>HN {hn || "—"}</span><span>วันที่จ่ายยา {date}</span></div>
    <h2>{data["drug-name"] || "ชื่อยา"}{!isDosageForm && data.strength ? ` ${data.strength}` : ""}</h2>
    {isDosageForm && <p>รูปแบบยา: {formLabel}</p>}
    <p className="drug-label-quantity">จำนวน {data.quantity || "—"} {unitLabel}</p>
    <div className="drug-label-directions"><strong>วิธีใช้</strong><p>{data.directions || "ระบุวิธีใช้ตามคำสั่งผู้สั่งใช้ยา"}</p></div>
    {data.indication && <p><b>ข้อบ่งใช้:</b> {data.indication}</p>}
    {data.warnings && <p><b>คำเตือน / ข้อควรระวัง:</b> {data.warnings}</p>}
    {data.storage && <p><b>การเก็บรักษา:</b> {data.storage}</p>}
    {data.expiry && <p><b>วันหมดอายุ (ค.ศ.):</b> {data.expiry}</p>}
    <footer>ผู้จ่ายยา: {data.dispenser || "—"}</footer>
  </article>;
}
