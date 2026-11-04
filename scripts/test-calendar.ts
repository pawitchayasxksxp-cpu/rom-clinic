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
  let patientId: string | undefined;
  const future = new Date(`${bangkokToday()}T00:00:00Z`);
  future.setUTCDate(future.getUTCDate() + 7);
  const date = future.toISOString().slice(0, 10);
  try {
    const patient = await getDatabase().query<{ id: string }>(
      `INSERT INTO rom_patient (hn, first_name, last_name, birth_date, phone, department, registration_key)
       VALUES ($1, 'ทดสอบปฏิทิน', 'ข้อมูลจำลอง', '2000-01-01', '0812345678', 'GN', $2) RETURNING id::text`,
      [hn, randomUUID()],
    );
    patientId = patient.rows[0].id;
    await page.goto("http://localhost:3000/calendar");
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("อีเมลผู้ดูแลระบบ").fill(process.env.ADMIN_EMAIL!);
    await page.getByLabel("รหัสผ่าน", { exact: true }).fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole("navigation").getByRole("link", { name: "ปฏิทินการจอง", exact: true }).click();
    await expect(page.getByRole("heading", { name: "ปฏิทินการจอง", exact: true })).toBeVisible();
    await page.locator("#booking-hn").fill("NONEXISTENT");
    await page.locator("#booking-date").fill(date);
    await page.locator("#booking-time").fill("09:30");
    await page.locator("#booking-department").selectOption("GN");
    await page.locator("#booking-note").fill("ข้อมูลจำลองสำหรับทดสอบ");
    await page.getByRole("button", { name: "บันทึกการจอง", exact: true }).click();
    await expect(page.locator(".form-error")).toContainText("ไม่พบ HN");
    await expect(page.locator("#booking-time")).toHaveValue("09:30");
    await page.locator("#booking-hn").fill(hn);
    await page.getByRole("button", { name: "บันทึกการจอง", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/calendar\\?date=${date}&saved=1$`));
    const agenda = page.getByRole("region", { name: "รายการจองวันที่เลือก" });
    await expect(agenda).toContainText(hn);
    await expect(agenda).toContainText("09:30");
    await expect(agenda).toContainText("ยืนยันนัด");
    await page.reload();
    await expect(agenda).toContainText(hn);
    await expect(page.locator(`.calendar-day[href*="date=${date}"]`)).toContainText("ทดสอบปฏิทิน");
    await page.locator("#calendar-department").selectOption("DT");
    await page.getByRole("button", { name: "แสดง", exact: true }).click();
    await expect(agenda).not.toContainText(hn);
    await page.locator("#calendar-department").selectOption("GN");
    await page.getByRole("button", { name: "แสดง", exact: true }).click();
    await expect(agenda).toContainText(hn);
    await page.getByRole("link", { name: "เดือนถัดไป", exact: true }).click();
    await page.getByRole("link", { name: "เดือนก่อนหน้า", exact: true }).click();
    await page.locator(`.calendar-day[href*="date=${date}"]`).click();
    await expect(agenda).toContainText(hn);
    await page.locator("#booking-hn").fill(hn);
    await page.locator("#booking-date").fill(date);
    await page.locator("#booking-time").fill("09:30");
    await page.locator("#booking-department").selectOption("GN");
    await page.getByRole("button", { name: "บันทึกการจอง", exact: true }).click();
    await expect(page.locator(".form-error")).toContainText("ผู้ป่วยมีนัดในเวลานี้แล้ว");
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const record = await getDatabase().query("SELECT to_char(starts_at AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD HH24:MI') AS appointment FROM rom_booking WHERE patient_id = $1", [patientId]);
    expect(record.rows).toHaveLength(1);
    expect(record.rows[0].appointment).toBe(`${date} 09:30`);
    console.log("PASS: calendar authorization, booking persistence, validation, Thai time, day/month navigation, department filter, duplicate prevention, mobile layout.");
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
