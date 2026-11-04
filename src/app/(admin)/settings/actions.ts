"use server";

import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { uploadMasterImage, removeMasterImage, type ImageAsset } from "@/lib/master-images";
import { validateProfessional } from "@/lib/professional-validation";
import { getDatabase } from "@/lib/db";

export async function addAdmin(_state: { error: string; message: string }, form: FormData): Promise<{ error: string; message: string }> {
  await requireAdmin();
  const name = form.get("name");
  const rawEmail = form.get("email");
  const password = form.get("password");
  const confirm = form.get("confirm-password");
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100 || typeof rawEmail !== "string" || rawEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail.trim())) return { error: "กรุณากรอกชื่อและอีเมลให้ถูกต้อง", message: "" };
  if (typeof password !== "string" || password.length < 8 || password.length > 128) return { error: "รหัสผ่านต้องมี 8–128 ตัวอักษร", message: "" };
  if (password !== confirm) return { error: "รหัสผ่านและการยืนยันไม่ตรงกัน", message: "" };
  const professional = validateProfessional(form);
  if (professional.error) return { error: professional.error, message: "" };
  let image: ImageAsset | null = null;
  try {
    image = await uploadMasterImage(form);
    const hashed = await hashPassword(password);
    const id = randomUUID();
    // One statement keeps the account and user creation atomic.
    await getDatabase().query(
      `WITH new_admin AS (
        INSERT INTO rom_auth_user (id, name, email, "emailVerified", role, image_asset)
        VALUES ($1, $2, $3, false, 'admin', $7::jsonb) RETURNING id
       ), new_account AS (INSERT INTO rom_auth_account (id, "accountId", "providerId", "userId", password, "updatedAt")
         SELECT $4, id, 'credential', id, $5, CURRENT_TIMESTAMP FROM new_admin RETURNING "userId")
       INSERT INTO rom_admin_professional (user_id, details) SELECT "userId", $6::jsonb FROM new_account WHERE $6::jsonb IS NOT NULL`,
      [id, name.trim(), rawEmail.trim().toLowerCase(), randomUUID(), hashed, professional.data ? JSON.stringify(professional.data) : null, image ? JSON.stringify(image) : null],
    );
  } catch (error) {
    if (image) await removeMasterImage(image);
    return { error: (error as { code?: string }).code === "23505" ? "อีเมลนี้มีบัญชีแล้ว กรุณาใช้อีเมลอื่น" : "เพิ่มแอดมินไม่สำเร็จ กรุณาลองอีกครั้ง", message: "" };
  }
  revalidatePath("/settings"); revalidatePath("/master-data");
  return { error: "", message: "เพิ่มแอดมินเรียบร้อยแล้ว บัญชีใหม่สามารถเข้าสู่ระบบได้ทันที" };
}
