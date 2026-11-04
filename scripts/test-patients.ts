import { loadEnvConfig } from "@next/env";
import { chromium, expect } from "@playwright/test";
loadEnvConfig(process.cwd(), true);

async function main() {
  const { getDatabase, closeDatabase } = await import("../src/lib/db");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const hn = `TEST-${Date.now()}`;
  const registrationKeys: string[] = [];
  try {
    await page.goto("http://localhost:3000/registration/new");
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("อีเมลผู้ดูแลระบบ").fill(process.env.ADMIN_EMAIL!);
    await page.getByLabel("รหัสผ่าน", { exact: true }).fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole("navigation").getByRole("link", { name: "รายชื่อผู้ป่วย", exact: true }).click();
    await expect(page.getByRole("heading", { name: "รายชื่อผู้ป่วย", exact: true }).first()).toBeVisible();
    await page.getByRole("link", { name: "ลงทะเบียนผู้ป่วย", exact: true }).last().click();
    await expect(page).toHaveURL(/\/registration\/new$/);
    registrationKeys.push(await page.locator('input[name="registration-key"]').inputValue());
    await page.locator("#patient-type").selectOption("ผู้ป่วยใหม่");
    await page.locator("#hn").fill(hn);
    await page.locator("#first-name").fill("ทดสอบระบบ");
    await page.locator("#last-name").fill("ข้อมูลจำลอง");
    await page.locator("#birth-date").fill("2000-01-01");
    await page.locator("#phone").fill("0812345678");
    await page.locator("#department").selectOption("GN");
    await page.locator("#registered-postal-code").fill("abcde");
    await page.getByRole("button", { name: "บันทึกผู้ป่วย", exact: true }).click();
    await expect(page.locator(".form-error")).toContainText("รหัสไปรษณีย์");
    await expect(page.locator("#first-name")).toHaveValue("ทดสอบระบบ");
    await page.locator("#registered-postal-code").fill("10110");
    await page.getByRole("button", { name: "บันทึกผู้ป่วย", exact: true }).click();
    await expect(page).toHaveURL(/\/registration\?saved=1$/);
    await expect(page.getByRole("status")).toContainText("บันทึกข้อมูลผู้ป่วยเรียบร้อยแล้ว");
    await page.getByLabel("ค้นหาผู้ป่วย").fill(hn);
    await page.getByRole("button", { name: "ค้นหา", exact: true }).click();
    await expect(page.getByRole("cell", { name: hn, exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("cell", { name: hn, exact: true })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(noOverflow).toBe(true);
    const record = await getDatabase().query("SELECT details FROM rom_patient WHERE hn = $1", [hn]);
    expect(record.rows[0].details["registered-postal-code"]).toBe("10110");
    // A second form must reject an existing HN while retaining the entered data.
    await page.goto("http://localhost:3000/registration/new");
    registrationKeys.push(await page.locator('input[name="registration-key"]').inputValue());
    await page.locator("#patient-type").selectOption("ผู้ป่วยใหม่");
    await page.locator("#hn").fill(hn);
    await page.locator("#first-name").fill("ทดสอบระบบ");
    await page.locator("#last-name").fill("ข้อมูลจำลอง");
    await page.locator("#birth-date").fill("2000-01-01");
    await page.locator("#phone").fill("0812345678");
    await page.locator("#department").selectOption("GN");
    await page.getByRole("button", { name: "บันทึกผู้ป่วย", exact: true }).click();
    await expect(page.locator(".form-error")).toContainText("HN นี้มีอยู่แล้ว");
    await expect(page.locator("#first-name")).toHaveValue("ทดสอบระบบ");
    // A blank HN must generate a new, persisted number.
    await page.locator("#hn").fill("");
    await page.getByRole("button", { name: "บันทึกผู้ป่วย", exact: true }).click();
    await expect(page).toHaveURL(/\/registration\?saved=1$/);
    const generated = await getDatabase().query("SELECT hn FROM rom_patient WHERE registration_key = $1", [registrationKeys[1]]);
    expect(generated.rows[0].hn).toMatch(/^ROM-\d{8,}$/);
    console.log("PASS: protected form, menu, validation, retained fields, database save, search, refresh, mobile layout, duplicate HN rejection, generated HN.");
  } finally {
    await getDatabase().query("DELETE FROM rom_patient WHERE registration_key = ANY($1::uuid[])", [registrationKeys]);
    await browser.close();
    await closeDatabase();
  }
}
void main().catch((error) => { console.error(error.message); process.exitCode = 1; });
