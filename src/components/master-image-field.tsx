import Image from "next/image";
export function MasterImageField({ id, url }: { id: string; url?: string | null }) {
  return <div className="field master-image-field"><label htmlFor={id}>รูปภาพ (ถ้ามี)</label>{url && <Image src={url} alt="รูปภาพที่บันทึก" width={90} height={90} unoptimized />}<input id={id} name="photo" type="file" accept="image/jpeg,image/png,image/webp" /><p className="form-note">JPG, PNG หรือ WebP ไม่เกิน 5 MB</p></div>;
}
