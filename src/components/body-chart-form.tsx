"use client";
import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { Save, Trash2 } from "lucide-react";
import { BodyChartImage } from "./body-chart-image";
import { saveBodyChart } from "@/app/(admin)/registration/body-chart-actions";
import type { BodyPoint } from "@/lib/body-chart-validation";
export function BodyChartForm({ patientId, recordKey, date, provider }: { patientId: string; recordKey: string; date: string; provider: string }) {
  const [points, setPoints] = useState<BodyPoint[]>([]);
  const [pointError, setPointError] = useState("");
  const [state, action, pending] = useActionState(saveBodyChart, { error: "" });
  return <form className="registration-form body-chart-form" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => action(data)); }}>
    <input type="hidden" name="patient-id" value={patientId} /><input type="hidden" name="record-key" value={recordKey} /><input type="hidden" name="points" value={JSON.stringify(points)} />
    <fieldset disabled={pending}>
      <div className="field-grid"><div className="field"><label htmlFor="chart-date">วันที่บันทึก (ค.ศ.)</label><input id="chart-date" name="chart-date" type="date" required max={date} defaultValue={date} /></div><div className="field"><label htmlFor="chart-provider">ผู้บันทึก</label><input id="chart-provider" name="provider" required maxLength={254} defaultValue={provider} /></div></div>
      <p className="body-chart-instructions">กดบนภาพเพื่อเพิ่มจุด แล้วกรอกรายละเอียดของแต่ละตำแหน่ง หรือเพิ่มตำแหน่งด้วยพิกัด X / Y ด้านล่าง</p>
      <div className="body-chart-canvas"><BodyChartImage points={points} onAdd={(x, y) => { if (pending) return; if (points.length >= 50) { setPointError("เพิ่มได้ไม่เกิน 50 จุด"); return; } setPointError(""); setPoints(previous => [...previous, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, note: "" }]); }} /></div>
      <div className="body-chart-controls"><button type="button" className="button button-secondary" disabled={points.length >= 50} onClick={() => setPoints(previous => [...previous, { x: 542, y: 391, note: "" }])}>เพิ่มตำแหน่งด้วยพิกัด</button><span>{points.length} / 50 จุด</span></div>
      <ol className="body-point-list">{points.map((point, index) => <li key={index}><strong>จุดที่ {index + 1}</strong><div className="body-point-coordinates"><label>X<input aria-label={`พิกัด X จุดที่ ${index + 1}`} type="number" min="0" max="1084" step="0.1" value={point.x} onChange={event => { const x = Number(event.target.value); setPoints(previous => previous.map((p, i) => i === index ? { ...p, x } : p)); }} /></label><label>Y<input aria-label={`พิกัด Y จุดที่ ${index + 1}`} type="number" min="0" max="782" step="0.1" value={point.y} onChange={event => { const y = Number(event.target.value); setPoints(previous => previous.map((p, i) => i === index ? { ...p, y } : p)); }} /></label></div><input aria-label={`รายละเอียดจุดที่ ${index + 1}`} maxLength={500} value={point.note} placeholder="ระบุอาการ / ตำแหน่ง" onChange={event => { const note = event.target.value; setPoints(previous => previous.map((p, i) => i === index ? { ...p, note } : p)); }} /><button type="button" className="icon-button" aria-label={`ลบจุดที่ ${index + 1}`} onClick={() => { setPoints(previous => previous.filter((_, i) => i !== index)); setPointError(""); }}><Trash2 size={18} /></button></li>)}</ol>
      <div className="field"><label htmlFor="body-chart-note">บันทึกเพิ่มเติม</label><textarea id="body-chart-note" name="note" rows={3} maxLength={2000} /></div>
      {(state.error || pointError) && <p role="alert" className="form-error">{pointError || state.error}</p>}
      <div className="registration-action-buttons"><button className="button button-primary" type="submit" disabled={pending}><Save size={18} />{pending ? "กำลังบันทึก…" : "บันทึก Body Chart"}</button><Link href={`/registration/${patientId}/body-chart`} className="button button-secondary">ยกเลิก</Link></div>
    </fieldset>
  </form>;
}
