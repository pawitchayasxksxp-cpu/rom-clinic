"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { recordDispensing } from "@/lib/dispensing-stock";

export async function saveDispensing(_state: { error: string }, form: FormData): Promise<{ error: string }> {
  const user = await requireAdmin();
  let saved;
  try { saved = await recordDispensing(form, user.id); }
  catch (error) { return { error: error instanceof Error && !('code' in error) ? error.message : "บันทึกการจ่ายยาไม่สำเร็จ กรุณาลองอีกครั้ง" }; }
  const {patientId, key} = saved;
  revalidatePath("/master-data");
  revalidatePath("/dispensing");
  revalidatePath(`/registration/${patientId}`);
  redirect(`/dispensing/${key}${form.get("print-after-save") === "1" ? "?print=1" : ""}`);
}
