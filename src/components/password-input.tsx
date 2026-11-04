"use client";
import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
export function PasswordInput({ toggleLabel = "รหัสผ่าน", ...props }: InputHTMLAttributes<HTMLInputElement> & { toggleLabel?: string }) {
  const [visible, setVisible] = useState(false);
  return <div className="password-input"><input {...props} type={visible ? "text" : "password"} /><button type="button" className="password-toggle" aria-label={`${visible ? "ซ่อน" : "แสดง"}${toggleLabel}`} aria-pressed={visible} disabled={props.disabled} onClick={() => setVisible(value => !value)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>;
}
