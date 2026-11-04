import { loadEnvConfig } from "@next/env";
import { chromium, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { bangkokToday } from "../src/lib/calendar";
loadEnvConfig(process.cwd(), true);

async function main() {
  const { getDatabase, closeDatabase } = await import("../src/lib/db");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  const hn = `TEST-${Date.now()}`;
  const today = bangkokToday();
  const tomorrow = new Date(`${today}T00:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  let patientId: string | undefined;
  const firstBookingId = randomUUID();
  try {
    const patient = await getDatabase().query<{ id: string }>(
      `INSERT INTO rom_patient (hn, first_name, last_name, birth_date, phone, department, registration_key)
       VALUES ($1, 'ทดสอบคิวจากปฏิทิน', 'ข้อมูลจำลอง', '2000-01-01', '0812345678', 'GN', $2) RETURNING id::text`, [hn, randomUUID()],
    );
    patientId = patient.rows[0].id;
    const fixtures = [
      { id: randomUUID(), date: today, time: "11:22", status: "confirmed" },
      { id: firstBookingId, date: today, time: "10:11", status: "confirmed" },
      { id: randomUUID(), date: today, time: "12:33", status: "cancelled" },
      { id: randomUUID(), date: today, time: "13:44", status: "completed" },
      { id: randomUUID(), date: tomorrow.toISOString().slice(0, 10), time: "00:00", status: "confirmed" },
    ];
    for (const booking of fixtures) await getDatabase().query("INSERT INTO rom_booking (id, patient_id, starts_at, department, status) VALUES ($1, $2, $3, 'GN', $4)", [booking.id, patientId, `${booking.date}T${booking.time}:00+07:00`, booking.status]);
    await page.goto("http://localhost:3000/login");
    await page.getByLabel("อีเมลผู้ดูแลระบบ").fill(process.env.ADMIN_EMAIL!);
    await page.getByLabel("รหัสผ่าน", { exact: true }).fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    const rows = page.locator(".dashboard-waiting-table tbody tr").filter({ hasText: hn });
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText("10:11");
    await expect(rows.nth(1)).toContainText("11:22");
    await expect(rows.nth(0)).toContainText("รอรับบริการ");
    await expect(rows.nth(0).getByRole("link")).toHaveAttribute("href", `/registration/${patientId}`);
    await getDatabase().query("UPDATE rom_booking SET status = 'cancelled' WHERE id = $1", [firstBookingId]);
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(rows).toHaveCount(1);
    await expect(rows.nth(0)).toContainText("11:22");
    await page.reload();
    await expect(rows).toHaveCount(1);
    console.log("PASS: dashboard uses calendar bookings, time order, confirmed-only waiting list, Thai-date boundary, patient links, focus refresh and reload.");
  } finally {
    if (patientId) {
      await getDatabase().query("DELETE FROM rom_booking WHERE patient_id = $1", [patientId]);
      await getDatabase().query("DELETE FROM rom_patient WHERE id = $1 AND hn = $2", [patientId, hn]);
    }
    await browser.close();
    await closeDatabase();
  }
}
void main().catch(error => { console.error(error.message); process.exitCode = 1; });
