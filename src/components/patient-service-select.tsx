"use client";

import { useState, useTransition } from "react";
import { updatePatientService } from "@/app/(admin)/registration/actions";
import { patientServices } from "@/lib/patient-service";

export function PatientServiceSelect({ id, hn, value }: { id: string; hn: string; value: string | null }) {
  const [selected, setSelected] = useState(value || "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  return <div className="patient-service-select">
    <select aria-label={`ประเภทบริการ ${hn}`} value={selected} disabled={pending} onChange={event => {
      const next = event.target.value;
      setError("");
      setSaved(false);
      startTransition(async () => {
        try {
          const result = await updatePatientService(id, next);
          if (result.error) setError(result.error);
          else { setSelected(next); setSaved(true); }
        } catch { setError("บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง"); }
      });
    }}>
      <option value="" disabled>ยังไม่ระบุ</option>
      {patientServices.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
    </select>
    {error ? <p role="alert">{error}</p> : <span role="status">{pending ? "กำลังบันทึก…" : saved ? "บันทึกแล้ว" : ""}</span>}
  </div>;
}
