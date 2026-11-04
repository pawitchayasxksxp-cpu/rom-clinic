"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";

export function MasterImageField({ id, url }: { id: string; url?: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    const form = input.current?.form;
    const reset = () => { setPreview(""); setFilename(""); setError(""); };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, []);
  const clearSelection = () => {
    if (input.current) input.current.value = "";
    setPreview(""); setFilename("");
  };
  return <div className="field master-image-field">
    <label htmlFor={id}>รูปภาพ (ถ้ามี)</label>
    {(preview || url) && <div className="master-image-preview"><Image src={preview || url!} alt={preview ? "พรีวิวรูปภาพที่เลือก" : "รูปภาพที่บันทึก"} width={200} height={160} unoptimized onError={preview ? () => { clearSelection(); setError("เปิดรูปภาพไม่ได้ กรุณาเลือกไฟล์รูปภาพใหม่"); } : undefined} /></div>}
    <div className="master-image-actions"><button type="button" className="button button-secondary" onClick={() => input.current?.click()}><ImagePlus size={18} />{preview || url ? "เปลี่ยนรูปภาพ" : "อัปโหลดรูปภาพ"}</button>{preview && <button type="button" className="button button-secondary" onClick={() => { clearSelection(); setError(""); }}><X size={17} />ยกเลิกรูปที่เลือก</button>}</div>
    <input ref={input} id={id} name="photo" type="file" hidden accept="image/jpeg,image/png,image/webp" aria-describedby={`${id}-help`} onChange={event => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0) {
        clearSelection(); setError("กรุณาเลือกไฟล์ JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB"); return;
      }
      setError(""); setFilename(file.name); setPreview(URL.createObjectURL(file));
    }} />
    <p className="form-note" id={`${id}-help`}>JPG, PNG หรือ WebP ไม่เกิน 5 MB · รูปจะอัปโหลดเมื่อกดบันทึกข้อมูล</p>
    {filename && <p className="master-image-filename" role="status">รูปที่เลือก: {filename}</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>;
}
