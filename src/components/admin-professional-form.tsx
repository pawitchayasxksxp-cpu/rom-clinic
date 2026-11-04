"use client";
import { startTransition, useActionState } from "react";
import { ProfessionalFields } from "./professional-fields";
import { saveProfessional } from "@/app/(admin)/settings/professional-actions";
export function AdminProfessionalForm({ userId, values }: { userId: string; values: Record<string, string> | null }) {
  const [state, action, pending] = useActionState(saveProfessional, { error: "", message: "" });
  return <details className="admin-professional"><summary>ข้อมูลใบประกอบวิชาชีพ</summary><form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => action(data)); }}><input type="hidden" name="user-id" value={userId} /><fieldset disabled={pending}><ProfessionalFields prefix={`professional-${userId}`} values={values || {}} />{state.error && <p role="alert" className="form-error">{state.error}</p>}{state.message && <p role="status" className="form-feedback">{state.message}</p>}<button type="submit" className="button button-secondary" disabled={pending}>{pending ? "กำลังบันทึก…" : "บันทึกใบประกอบวิชาชีพ"}</button></fieldset></form></details>;
}
