"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.email({
        email: String(data.get("email") || "")
          .trim()
          .toLowerCase(),
        password: String(data.get("password") || ""),
        rememberMe: false,
      });
      if (result.error) {
        setError(
          result.error.status === 429
            ? "มีการเข้าสู่ระบบหลายครั้ง กรุณารอ 1 นาทีแล้วลองใหม่"
            : result.error.status >= 500
              ? "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง"
              : "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        );
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง");
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="login-form">
      <label htmlFor="email">อีเมลผู้ดูแลระบบ</label>
      <div className="input-icon">
        <Mail size={18} aria-hidden="true" />
        <input
          id="email"
          name="email"
          type="email"
          placeholder="name@clinic.com"
          autoComplete="username"
          required
          maxLength={254}
          disabled={pending}
        />
      </div>
      <label htmlFor="password">รหัสผ่าน</label>
      <div className="input-icon">
        <LockKeyhole size={18} aria-hidden="true" />
        <input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          placeholder="กรอกรหัสผ่านของคุณ"
          autoComplete="current-password"
          required
          maxLength={128}
          disabled={pending}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <p className="form-note">
        สำหรับผู้ดูแลระบบและเจ้าหน้าที่ที่ได้รับสิทธิ์เท่านั้น
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="button button-primary login-submit"
        type="submit"
        disabled={pending}
      >
        {pending ? (
          <>
            <LoaderCircle className="spin" size={18} />
            กำลังเข้าสู่ระบบ…
          </>
        ) : (
          <>
            เข้าสู่ระบบ
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
}
