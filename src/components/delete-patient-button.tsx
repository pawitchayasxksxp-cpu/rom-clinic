"use client";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePatient } from "@/app/(admin)/registration/actions";
export function DeletePatientButton({id, hn, name, compact = false}: {id: string; hn: string; name: string; compact?: boolean}) {
  const [pending,startTransition] = useTransition();
  const [error,setError] = useState("");
  return <div className="patient-delete-control"><button type="button" className={compact ? "icon-button patient-delete-button" : "button button-secondary patient-delete-button"} title="ลบผู้ป่วย" aria-label={`ลบผู้ป่วย ${hn}`} disabled={pending} onClick={() => {
    if (!window.confirm(`ยืนยันลบผู้ป่วย ${hn} · ${name}?\nผู้ป่วยจะถูกนำออกจากรายชื่อและไม่สามารถเลือกทำรายการใหม่ได้ ประวัติการรักษาและการจ่ายยาเดิมยังเก็บไว้`)) return;
    setError("");
    startTransition(async () => {const result = await deletePatient(id); if (result?.error) setError(result.error);});
  }}><Trash2 size={18} aria-hidden="true" />{!compact && (pending ? "กำลังลบ…" : "ลบผู้ป่วย")}</button>{error && <p role="alert" className="form-error">{error}</p>}</div>;
}
