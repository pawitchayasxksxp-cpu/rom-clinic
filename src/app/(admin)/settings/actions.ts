"use server";

import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { getDatabase } from "@/lib/db";

export async function addAdmin(_state: { error: string; message: string }, form: FormData): Promise<{ error: string; message: string }> {
  await requireAdmin();
  const name = form.get("name");
  const rawEmail = form.get("email");
  const password = form.get("password");
  const confirm = form.get("confirm-password");
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100 || typeof rawEmail !== "string" || rawEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail.trim())) return { error: "กรุณากรอกชื่อและอีเมลให้ถูกต้อง", message: "" };
  if (typeof password !== "string" || password.length < 12 || password.length > 128) return { error: "รหัสผ่านต้องมี 12–128 ตัวอักษร", message: "" };
  if (password !== confirm) return { error: "รหัสผ่านและการยืนยันไม่ตรงกัน", message: "" };
  try {
    const hashed = await hashPassword(password);
    const id = randomUUID();
    // One statement keeps the account and user creation atomic.
    await getDatabase().query(
      `WITH new_admin AS (
        INSERT INTO rom_auth_user (id, name, email, "emailVerified", role)
        VALUES ($1, $2, $3, false, 'admin') RETURNING id
       ) INSERT INTO rom_auth_account (id, "accountId", "providerId", "userId", password, "updatedAt")
         SELECT $4, id, 'credential', id, $5, CURRENT_TIMESTAMP FROM new_admin`,
      [id, name.trim(), rawEmail.trim().toLowerCase(), randomUUID(), hashed],
    );
  } catch (error) {
    return { error: (error as { code?: string }).code === "23505" ? "อีเมลนี้มีบัญชีแล้ว กรุณาใช้อีเมลอื่น" : "เพิ่มแอดมินไม่สำเร็จ กรุณาลองอีกครั้ง", message: "" };
  }
  revalidatePath("/settings");
  return { error: "", message: "เพิ่มแอดมินเรียบร้อยแล้ว บัญชีใหม่สามารถเข้าสู่ระบบได้ทันที" };
}
