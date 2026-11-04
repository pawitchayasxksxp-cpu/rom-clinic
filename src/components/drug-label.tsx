import type { DrugLabelData } from "@/lib/dispensing-validation";

export function DrugLabel({ data, patientName, hn, date }: { data: DrugLabelData; patientName: string; hn: string; date: string }) {
  return <article className="drug-label" aria-label="ฉลากยา">
    <header><strong>ROM Clinic</strong><span>ฉลากยา</span></header>
    <div className="drug-label-patient"><strong>{patientName || "ชื่อผู้ป่วย"}</strong><span>HN {hn || "—"}</span><span>วันที่จ่ายยา {date}</span></div>
    <h2>{data["drug-name"] || "ชื่อยา"} {data.strength}</h2>
    <p className="drug-label-quantity">จำนวน {data.quantity || "—"} {data.unit}</p>
    <div className="drug-label-directions"><strong>วิธีใช้</strong><p>{data.directions || "ระบุวิธีใช้ตามคำสั่งผู้สั่งใช้ยา"}</p></div>
    {data.indication && <p><b>ข้อบ่งใช้:</b> {data.indication}</p>}
    {data.warnings && <p><b>คำเตือน / ข้อควรระวัง:</b> {data.warnings}</p>}
    {data.storage && <p><b>การเก็บรักษา:</b> {data.storage}</p>}
    {data.expiry && <p><b>วันหมดอายุ (ค.ศ.):</b> {data.expiry}</p>}
    <footer>ผู้จ่ายยา: {data.dispenser || "—"}</footer>
  </article>;
}
