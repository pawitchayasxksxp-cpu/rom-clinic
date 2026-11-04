"use server";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getDatabase } from "@/lib/db";
import { uploadMasterImage, removeMasterImage, type ImageAsset } from "@/lib/master-images";
export async function editAdmin(_state: { error: string; message: string }, form: FormData): Promise<{ error: string; message: string }> {
  const actor = await requireAdmin();
  const id = form.get("user-id"), name = form.get("name"), email = form.get("email"), password = form.get("password");
  if (typeof id !== "string" || id.length > 128 || typeof name !== "string" || !name.trim() || name.length > 100 || typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== "string" || (password && (password.length < 8 || password.length > 128))) return { error: "ตรวจสอบชื่อ อีเมล และรหัสผ่าน (ถ้ากรอก ต้องมี 8–128 ตัวอักษร)", message: "" };
  let image: ImageAsset | null = null; let mustLogin = false;
  try {
    image = await uploadMasterImage(form); const hashed = password ? await hashPassword(password) : null;
    const client = await getDatabase().connect();
    try {
      await client.query("BEGIN"); await client.query("SELECT pg_advisory_xact_lock(hashtext('rom-clinic-admin-management'))");
      const check = await client.query("SELECT id, email FROM rom_auth_user WHERE role='admin' AND id=ANY($1::text[])", [[actor.id, id]]);
      if (!check.rows.some(row => row.id === actor.id) || !check.rows.some(row => row.id === id)) throw new Error("not-admin");
      const previous = check.rows.find(row => row.id === id);
      await client.query('UPDATE rom_auth_user SET name=$2, email=$3, "emailVerified"=CASE WHEN email=$3 THEN "emailVerified" ELSE false END, image_asset=COALESCE($4::jsonb,image_asset), "updatedAt"=CURRENT_TIMESTAMP WHERE id=$1', [id, name.trim(), email.trim().toLowerCase(), image ? JSON.stringify(image) : null]);
      if (hashed) {
        const updated = await client.query('UPDATE rom_auth_account SET password=$2, "updatedAt"=CURRENT_TIMESTAMP WHERE "userId"=$1 AND "providerId"=\'credential\' RETURNING id', [id, hashed]);
        if (!updated.rowCount) await client.query('INSERT INTO rom_auth_account (id,"accountId","providerId","userId",password,"updatedAt") VALUES ($1,$2,\'credential\',$2,$3,CURRENT_TIMESTAMP)', [randomUUID(), id, hashed]);
      }
      if (hashed || previous.email !== email.trim().toLowerCase()) { await client.query('DELETE FROM rom_auth_session WHERE "userId"=$1', [id]); mustLogin = id === actor.id; }
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  } catch { if (image) await removeMasterImage(image); return { error: "แก้ไขแอดมินไม่สำเร็จ อีเมลอาจซ้ำหรือไฟล์รูปไม่ถูกต้อง", message: "" }; }
  revalidatePath("/master-data"); revalidatePath("/settings"); if (mustLogin) redirect("/login");
  return { error: "", message: "แก้ไขแอดมินแล้ว" };
}
export async function removeAdmin(id: string): Promise<{ error: string }> {
  const actor = await requireAdmin(); if (id === actor.id) return { error: "ไม่สามารถลบบัญชีที่กำลังใช้งาน" };
  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN"); await client.query("SELECT pg_advisory_xact_lock(hashtext('rom-clinic-admin-management'))");
    const admins = await client.query<{ id: string }>("SELECT id FROM rom_auth_user WHERE role='admin'");
    if (!admins.rows.some(row => row.id === actor.id) || admins.rows.length <= 1) throw new Error("last-admin");
    await client.query("UPDATE rom_auth_user SET role='user', \"updatedAt\"=CURRENT_TIMESTAMP WHERE id=$1 AND role='admin'", [id]);
    await client.query('DELETE FROM rom_auth_session WHERE "userId"=$1', [id]);
    await client.query("COMMIT");
  } catch { await client.query("ROLLBACK"); return { error: "ลบแอดมินไม่สำเร็จ ต้องมีแอดมินเหลืออย่างน้อย 1 บัญชี" }; } finally { client.release(); }
  revalidatePath("/master-data"); revalidatePath("/settings"); return { error: "" };
}
