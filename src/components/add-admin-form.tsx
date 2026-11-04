"use client";

import { startTransition, useActionState, useRef } from "react";
import { UserPlus } from "lucide-react";
import { addAdmin } from "@/app/(admin)/settings/actions";

export function AddAdminForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (previous: { error: string; message: string }, data: FormData) => {
    const result = await addAdmin(previous, data);
    if (!result.error) formRef.current?.reset();
    return result;
  }, { error: "", message: "" });
  return <form ref={formRef} className="registration-form" onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  }} aria-busy={pending}>
    <fieldset disabled={pending}>
      <div className="field"><label htmlFor="admin-name">ชื่อแอดมิน <span>*</span></label><input id="admin-name" name="name" required maxLength={100} autoComplete="off" /></div>
      <div className="field"><label htmlFor="admin-email">อีเมลแอดมิน <span>*</span></label><input id="admin-email" name="email" required type="email" maxLength={254} autoComplete="off" /></div>
      <div className="field-grid">
        <div className="field"><label htmlFor="admin-password">รหัสผ่านบัญชีใหม่ <span>*</span></label><input id="admin-password" name="password" required type="password" minLength={12} maxLength={128} autoComplete="new-password" /></div>
        <div className="field"><label htmlFor="admin-confirm-password">ยืนยันรหัสผ่านบัญชีใหม่ <span>*</span></label><input id="admin-confirm-password" name="confirm-password" required type="password" minLength={12} maxLength={128} autoComplete="new-password" /></div>
      </div>
      <p className="form-note">บัญชีใหม่มีสิทธิ์แอดมินสำหรับจัดการข้อมูลและตั้งค่าระบบ</p>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.message && <p className="form-feedback" role="status">{state.message}</p>}
      <button type="submit" className="button button-primary" disabled={pending}><UserPlus size={18} />{pending ? "กำลังเพิ่ม…" : "เพิ่มแอดมิน"}</button>
    </fieldset>
  </form>;
}
