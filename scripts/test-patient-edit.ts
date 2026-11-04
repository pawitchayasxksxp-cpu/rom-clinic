import { loadEnvConfig } from "@next/env";
import { chromium, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
loadEnvConfig(process.cwd(), true);

async function main() {
  const { getDatabase, closeDatabase } = await import("../src/lib/db");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  const hn = `TEST-${Date.now()}`;
  let patientId: string | undefined;
  try {
    const details = {
      "patient-type": "ผู้ป่วยเดิม", "service-type": "course", "first-name": "ชื่อเก่าในรายละเอียด",
      priority: "urgent", "registered-line": "ที่อยู่ทดสอบ", "current-province": "กรุงเทพมหานคร",
      "allergy-details": "ข้อมูลแพ้สำหรับทดสอบ", symptoms: "อาการทดสอบ\nบรรทัดที่สอง",
      "bp-systolic": "120", "bp-diastolic": "80", pulse: "72", "extra-note": "preserve-this",
    };
    const fixture = await getDatabase().query<{ id: string; created_at: Date }>(
      `INSERT INTO rom_patient (hn, first_name, last_name, birth_date, phone, department, registration_key, details)
       VALUES ($1, 'ทดสอบแก้ไข', 'ข้อมูลจำลอง', '2000-01-01', '0812345678', 'DT', $2, $3::jsonb) RETURNING id::text, created_at`, [hn, randomUUID(), JSON.stringify(details)],
    );
    patientId = fixture.rows[0].id;
    await page.goto(`http://localhost:3000/registration/${patientId}/edit`);
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("อีเมลผู้ดูแลระบบ").fill(process.env.ADMIN_EMAIL!);
    await page.getByLabel("รหัสผ่าน", { exact: true }).fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto(`http://localhost:3000/registration/${patientId}`);
    await page.getByRole("link", { name: "แก้ไขข้อมูล", exact: true }).click();
    await expect(page.locator("#hn")).toHaveValue(hn);
    await expect(page.locator("#hn")).toHaveAttribute("readonly", "");
    await expect(page.locator("#first-name")).toHaveValue("ทดสอบแก้ไข");
    await expect(page.locator("#birth-date")).toHaveValue("2000-01-01");
    await expect(page.locator("#department")).toHaveValue("DT");
    await expect(page.locator("#service-type")).toHaveValue("course");
    await expect(page.locator("#registered-line")).toHaveValue("ที่อยู่ทดสอบ");
    await expect(page.locator('input[value="urgent"]')).toBeChecked();
    await page.locator("#first-name").fill("แก้ไขเรียบร้อย");
    await page.locator("#phone").fill("0898765432");
    await page.locator("#bp-systolic").fill("128");
    await page.locator("#bp-diastolic").fill("82");
    await page.locator("#pulse").fill("76");
    await page.locator("#registered-postal-code").fill("abcde");
    const invalid = await page.locator(".hospital-registration").evaluate(form => Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")).filter(field => !field.checkValidity()).map(field => field.id));
    expect(invalid).toEqual([]);
    await page.getByRole("button", { name: "บันทึกการแก้ไข", exact: true }).click();
    await expect(page.locator(".form-error")).toContainText("รหัสไปรษณีย์");
    await expect(page.locator("#first-name")).toHaveValue("แก้ไขเรียบร้อย");
    await page.locator("#registered-postal-code").fill("10110");
    await page.getByRole("button", { name: "บันทึกการแก้ไข", exact: true }).click();
    await expect(page).toHaveURL(`http://localhost:3000/registration/${patientId}?saved=1`);
    await expect(page.getByRole("status")).toContainText("บันทึกการแก้ไข");
    await expect(page.getByRole("region", { name: "ข้อมูลสรุปผู้ป่วย" })).toContainText("128/82");
    await expect(page.getByRole("region", { name: "ข้อมูลสรุปผู้ป่วย" })).toContainText(hn);
    await page.reload();
    await expect(page.getByRole("region", { name: "ข้อมูลสรุปผู้ป่วย" })).toContainText("แก้ไขเรียบร้อย");
    const saved = await getDatabase().query("SELECT hn, phone, department, details, created_at FROM rom_patient WHERE id = $1", [patientId]);
    expect(saved.rows[0].hn).toBe(hn);
    expect(saved.rows[0].phone).toBe("0898765432");
    expect(saved.rows[0].department).toBe("DT");
    expect(saved.rows[0].created_at.toISOString()).toBe(fixture.rows[0].created_at.toISOString());
    expect(saved.rows[0].details["current-province"]).toBe("กรุงเทพมหานคร");
    expect(saved.rows[0].details["extra-note"]).toBe("preserve-this");
    await page.getByRole("link", { name: "แก้ไขข้อมูล", exact: true }).click();
    await page.locator("#phone").fill("0800000000");
    await page.getByRole("link", { name: "ยกเลิก", exact: true }).click();
    await expect(page.locator(".patient-detail-list")).toContainText(["0898765432"]);
    await page.getByRole("link", { name: "แก้ไขข้อมูล", exact: true }).click();
    await page.locator("#department").selectOption("TM");
    await page.locator("#allergy-details").fill("");
    await page.getByRole("button", { name: "บันทึกการแก้ไข", exact: true }).click();
    await expect(page).toHaveURL(`http://localhost:3000/registration/${patientId}?saved=1`);
    const updated = await getDatabase().query("SELECT department, details FROM rom_patient WHERE id = $1", [patientId]);
    expect(updated.rows[0].department).toBe("TM");
    expect(updated.rows[0].details["allergy-details"]).toBe("");
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    console.log("PASS: protected editing, prefilled fields, validation retention, unchanged HN/creation date, saved updates, legacy department handling, clearing optional values, cancel, mobile layout.");
  } finally {
    if (patientId) await getDatabase().query("DELETE FROM rom_patient WHERE id = $1 AND hn = $2", [patientId, hn]);
    await browser.close();
    await closeDatabase();
  }
}
void main().catch(error => { console.error(error.message); process.exitCode = 1; });
