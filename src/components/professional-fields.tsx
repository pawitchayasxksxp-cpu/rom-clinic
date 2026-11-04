"use client";
import { useState } from "react";
import { professions } from "@/lib/professional-validation";
export function ProfessionalFields({ prefix, values = {} }: { prefix: string; values?: Record<string, string> }) {
  const [profession, setProfession] = useState(values.profession || "");
  const input = (name: string, label: string, type = "text") => <div className="field" key={name}><label htmlFor={`${prefix}-${name}`}>{label}</label><input id={`${prefix}-${name}`} name={name} type={type} defaultValue={values[name] || ""} maxLength={254} /></div>;
  return <><div className="field-grid">{input("license-name", "ชื่อ–นามสกุลบนใบอนุญาต")}<div className="field"><label htmlFor={`${prefix}-profession`}>วิชาชีพ</label><select id={`${prefix}-profession`} name="profession" value={profession} onChange={event => setProfession(event.target.value)}><option value="">เลือกวิชาชีพ</option>{professions.map(value => <option key={value} value={value}>{value}</option>)}</select>{profession === "อื่น ๆ" && <div className="other-choice-note"><label htmlFor={`${prefix}-profession-other`}>หมายเหตุ / วิชาชีพอื่น ๆ <span>*</span></label><input id={`${prefix}-profession-other`} name="profession-other" required maxLength={254} defaultValue={values["profession-other"] || ""} /></div>}</div>{input("license-number", "เลขใบอนุญาตประกอบวิชาชีพ")}{input("license-issued", "วันที่ออกใบอนุญาต (ค.ศ.)", "date")}{input("license-expires", "วันหมดอายุ (ถ้ามี)", "date")}</div></>;
}
