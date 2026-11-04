"use client";
import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function PasswordForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const password = String(values.get("newPassword") || "");
    if (password !== values.get("confirmPassword")) {
      setMessage("รหัสผ่านใหม่และการยืนยันไม่ตรงกัน");
      return;
    }
    setPending(true);
    setMessage("");
    try {
      const result = await authClient.changePassword({
        currentPassword: String(values.get("currentPassword") || ""),
        newPassword: password,
        revokeOtherSessions: true,
      });
      if (result.error) {
        setMessage(
          result.error.status === 429
            ? "กรุณารอ 1 นาทีแล้วลองใหม่"
            : "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาตรวจสอบรหัสผ่านปัจจุบัน",
        );
        return;
      }
      form.reset();
      setMessage("เปลี่ยนรหัสผ่านแล้ว และออกจากระบบบนอุปกรณ์อื่นเรียบร้อย");
    } catch {
      setMessage("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่");
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="password-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="current-password">รหัสผ่านปัจจุบัน</label>
        <input
          id="current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          disabled={pending}
        />
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="new-password">รหัสผ่านใหม่</label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            disabled={pending}
          />
        </div>
        <div className="field">
          <label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            disabled={pending}
          />
        </div>
      </div>
      <p className="form-note">
        ใช้อย่างน้อย 12 ตัวอักษร เมื่อเปลี่ยนแล้ว
        อุปกรณ์อื่นจะต้องเข้าสู่ระบบอีกครั้ง
      </p>
      {message && (
        <p className="form-feedback" role="status">
          {message}
        </p>
      )}
      <button
        className="button button-primary"
        type="submit"
        disabled={pending}
      >
        <LockKeyhole size={17} />
        {pending ? "กำลังบันทึก…" : "เปลี่ยนรหัสผ่าน"}
      </button>
    </form>
  );
}
