"use client";
import { startTransition, useActionState, useState, useTransition } from "react";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { PasswordInput } from "./password-input";
import { MasterImageField } from "./master-image-field";
import { AdminProfessionalForm } from "./admin-professional-form";
import { editAdmin, removeAdmin } from "@/app/(admin)/master-data/admin-actions";
export function AdminEditForm({ id, name, email, imageUrl, isSelf, professional }: { id: string; name: string; email: string; imageUrl: string | null; isSelf: boolean; professional: Record<string,string> | null }) {
  const [state, action, pending] = useActionState(editAdmin, { error: "", message: "" });
  const [deleting, start] = useTransition(); const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  return <>
    <div className="admin-row-heading">
      <div className="admin-row-profile">{imageUrl && <Image src={imageUrl} alt={name} width={56} height={56} unoptimized />}<div><strong>{name}{isSelf && <span className="badge badge-teal">คุณ</span>}</strong><span>{email}</span></div></div>
      <div className="admin-row-actions"><button type="button" className="button button-secondary" disabled={pending || deleting} aria-expanded={editing} aria-controls={`admin-edit-${id}`} onClick={() => setEditing(previous => !previous)}><Pencil size={16} />แก้ไขแอดมิน</button><button type="button" className="button button-secondary" disabled={isSelf || deleting || pending} title={isSelf ? "ไม่สามารถลบบัญชีที่กำลังใช้งาน" : "ลบแอดมิน"} onClick={() => start(async () => { try { setError((await removeAdmin(id)).error); } catch { setError("ลบแอดมินไม่สำเร็จ"); } })}><Trash2 size={16} />{deleting ? "กำลังลบ…" : "ลบแอดมิน"}</button></div>
    </div>
    {error && <p role="alert" className="form-error">{error}</p>}
    <div id={`admin-edit-${id}`} className="admin-row-editor" hidden={!editing}>
      <form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => action(data)); }}><input type="hidden" name="user-id" value={id} /><fieldset disabled={pending}>
        <div className="field-grid"><div className="field"><label htmlFor={`edit-admin-name-${id}`}>ชื่อแอดมิน</label><input id={`edit-admin-name-${id}`} name="name" required maxLength={100} defaultValue={name} /></div><div className="field"><label htmlFor={`edit-admin-email-${id}`}>อีเมลแอดมิน</label><input id={`edit-admin-email-${id}`} name="email" required type="email" maxLength={254} defaultValue={email} /></div></div>
        <div className="field"><label htmlFor={`edit-admin-password-${id}`}>รหัสผ่านใหม่ (เว้นว่างเพื่อใช้รหัสเดิม)</label><PasswordInput id={`edit-admin-password-${id}`} name="password" minLength={8} maxLength={128} autoComplete="new-password" toggleLabel={`รหัสผ่านใหม่ของ ${name}`} /><p className="form-note">เมื่อเปลี่ยนอีเมลหรือรหัสผ่าน บัญชีนี้ต้องเข้าสู่ระบบใหม่</p></div>
        <MasterImageField id={`edit-admin-photo-${id}`} url={imageUrl} />{state.error && <p role="alert" className="form-error">{state.error}</p>}{state.message && <p role="status" className="form-feedback">{state.message}</p>}<button type="submit" className="button button-primary" disabled={pending}>บันทึกแอดมิน</button>
      </fieldset></form>
      <AdminProfessionalForm userId={id} values={professional} />
    </div>
  </>;
}
