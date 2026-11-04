"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { getDatabase } from "@/lib/db";
import { validateBooking } from "@/lib/calendar";

export async function createBooking(_state: { error: string }, form: FormData): Promise<{ error: string }> {
  await requireAdmin();
  const result = validateBooking(form);
  if (!result.data) return { error: result.error! };
  const data = result.data;
  try {
    const saved = await getDatabase().query(
      `INSERT INTO rom_booking (id, patient_id, starts_at, department, note)
       SELECT $1::uuid, id, $3::timestamptz, $4, $5 FROM rom_patient
       WHERE COALESCE(hn, 'ROM-' || lpad(id::text, 8, '0')) = $2
       ON CONFLICT (id) DO UPDATE SET id = rom_booking.id
       RETURNING id`,
      [data["booking-key"], data.hn, `${data.date}T${data.time}:00+07:00`, data.department, data.note],
    );
    if (!saved.rowCount) return { error: "ไม่พบ HN นี้ กรุณาตรวจสอบรายชื่อหรือลงทะเบียนผู้ป่วยก่อน" };
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return { error: "ผู้ป่วยมีนัดในเวลานี้แล้ว กรุณาเลือกเวลาอื่น" };
    return { error: "บันทึกการจองไม่สำเร็จ กรุณาลองอีกครั้ง" };
  }
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  redirect(`/calendar?date=${data.date}&saved=1`);
}
