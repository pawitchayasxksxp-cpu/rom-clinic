"use client";

import { useEffect, useRef, useState } from "react";
import type { PatientChoice } from "@/lib/patients";
import { Check, Search, UserRound } from "lucide-react";

export function PatientPicker({ idPrefix = "booking", listLabel = "รายชื่อผู้ป่วยสำหรับจอง", onSelect }: { idPrefix?: string; listLabel?: string; onSelect?: (patient: PatientChoice | null) => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PatientChoice | null>(null);
  const [open, setOpen] = useState(false);
  const [patients, setPatients] = useState<PatientChoice[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [composing, setComposing] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.setCustomValidity(selected ? "" : "กรุณาเลือกผู้ป่วยจากรายชื่อ");
  }, [selected]);

  useEffect(() => {
    if (!open || selected || composing) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/patients/search?${new URLSearchParams({ q: query.trim() })}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error(response.status === 401 ? "กรุณาเข้าสู่ระบบใหม่ก่อนค้นหาผู้ป่วย" : "ค้นหาผู้ป่วยไม่สำเร็จ กรุณาพิมพ์ค้นหาอีกครั้ง");
        const result: { patients: PatientChoice[]; hasMore: boolean } = await response.json();
        if (!controller.signal.aborted) { setPatients(result.patients); setHasMore(result.hasMore); }
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "ค้นหาผู้ป่วยไม่สำเร็จ");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, open, selected, composing]);

  return <div className="field patient-picker" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <label htmlFor={`${idPrefix}-patient-search`}>เลือกผู้ป่วย <span>*</span></label>
    <input type="hidden" name="hn" value={selected?.hn || ""} />
    <div className="patient-picker-input"><Search size={18} aria-hidden="true" /><input ref={input} id={`${idPrefix}-patient-search`} required autoComplete="off" value={query} readOnly={Boolean(selected)} placeholder="พิมพ์ชื่อ CN หรือเบอร์โทรศัพท์" onFocus={() => { if (!selected) setOpen(true); }} onChange={event => { setQuery(event.target.value); setPatients([]); setHasMore(false); setError(""); setOpen(true); }} onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); setOpen(false); } }} aria-controls={open ? `${idPrefix}-patient-options` : undefined} aria-describedby={`${idPrefix}-patient-help`} /></div>
    {selected ? <div id={`${idPrefix}-patient-help`} className="patient-picker-selected"><Check size={17} aria-hidden="true" /><span>เลือกแล้ว: <strong>{selected.hn}</strong></span><button type="button" onClick={() => { setSelected(null); onSelect?.(null); setQuery(""); setPatients([]); setError(""); setOpen(true); setTimeout(() => input.current?.focus(), 0); }}>เปลี่ยนผู้ป่วย</button></div> : <p id={`${idPrefix}-patient-help`} className="form-note">กดช่องค้นหาเพื่อเลือกจากรายชื่อผู้ป่วยที่ลงทะเบียนแล้ว</p>}
    {open && !selected && <div className="patient-picker-results" id={`${idPrefix}-patient-options`}>
      {loading ? <p role="status">กำลังค้นหา…</p> : error ? <p role="alert">{error}</p> : patients.length ? <><ul aria-label={listLabel}>{patients.map(patient => <li key={patient.id}><button type="button" onClick={() => { setSelected(patient); onSelect?.(patient); setQuery(`${patient.first_name} ${patient.last_name}`); setOpen(false); }}><UserRound size={18} aria-hidden="true" /><span><strong>{patient.first_name} {patient.last_name}</strong><small>{patient.hn}</small></span></button></li>)}</ul>{hasMore && <p>แสดง 20 รายชื่อแรก พิมพ์เพิ่มเพื่อค้นหาให้เจาะจงขึ้น</p>}</> : <p role="status">{query.trim() ? "ไม่พบผู้ป่วยที่ค้นหา" : "พิมพ์เพื่อค้นหา หรือรอรายชื่อผู้ป่วยล่าสุด"}</p>}
    </div>}
  </div>;
}
