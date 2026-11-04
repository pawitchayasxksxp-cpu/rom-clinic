import "server-only";
import { getCloudinary, uploadFile } from "./cloudinary";
export type ImageAsset = { public_id: string; version: number; format: string };
export async function uploadMasterImage(form: FormData): Promise<ImageAsset | null> {
  const file = form.get("photo");
  if (!(file instanceof File) || !file.size) return null;
  if (file.size > 5 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("ใช้รูป JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB");
  const buffer = Buffer.from(await file.arrayBuffer());
  const valid = buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) || (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP");
  if (!valid) throw new Error("ไฟล์รูปภาพไม่ถูกต้อง");
  const result = await uploadFile(buffer);
  if (result.resource_type !== "image") { await removeMasterImage({ public_id: result.public_id, version: result.version, format: result.format }); throw new Error("ไฟล์รูปภาพไม่ถูกต้อง"); }
  return { public_id: result.public_id, version: result.version, format: result.format };
}
export async function removeMasterImage(asset: ImageAsset) {
  try { await getCloudinary().uploader.destroy(asset.public_id, { type: "authenticated", resource_type: "image" }); } catch { /* Keep the saved record valid if asset cleanup is temporarily unavailable. */ }
}
export function masterImageUrl(asset: ImageAsset | null | undefined) {
  return asset ? getCloudinary().url(asset.public_id, { version: asset.version, format: asset.format, type: "authenticated", resource_type: "image", sign_url: true, secure: true }) : null;
}
