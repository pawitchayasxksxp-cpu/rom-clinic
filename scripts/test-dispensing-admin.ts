import { loadEnvConfig } from "@next/env";
import { chromium, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
loadEnvConfig(process.cwd(), true);

async function main() {
  const { getDatabase, closeDatabase } = await import("../src/lib/db");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const hn = `TEST-${Date.now()}`;
  const email = `admin-test-${randomUUID()}@example.invalid`;
  const password = `Test-${randomUUID()}`;
  const medicineId = randomUUID();
  let patientId: string | undefined;
  let labelId: string | undefined;
  try {
    const patient = await getDatabase().query<{ id: string }>(
      `INSERT INTO rom_patient (hn, first_name, last_name, birth_date, phone, department, registration_key)
       VALUES ($1, 'ทดสอบฉลาก', 'ข้อมูลจำลอง', '2000-01-01', '0812345678', 'GN', $2) RETURNING id::text`, [hn, randomUUID()],
    );
    patientId = patient.rows[0].id;
    await getDatabase().query("INSERT INTO rom_medicine(id,name,dosage_form,unit,stock) VALUES($1,'ยาทดสอบระบบ','ยาเม็ด','เม็ด',10)",[medicineId]);
    await page.goto("http://localhost:3000/dispensing");
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("อีเมลผู้ดูแลระบบ").fill(process.env.ADMIN_EMAIL!);
    await page.getByLabel("รหัสผ่าน", { exact: true }).fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("http://localhost:3000/dispensing");
    await page.getByLabel("เลือกผู้ป่วย", { exact: false }).fill(hn);
    await page.getByRole("list", { name: "รายชื่อผู้ป่วยสำหรับจ่ายยา" }).getByRole("button").filter({ hasText: hn }).click();
    labelId = await page.locator('input[name="dispensing-key"]').inputValue();
    await page.locator("#drug-medicine").selectOption(medicineId);
    await page.locator("#drug-quantity").fill("2");
    await page.locator("#drug-directions").fill("ข้อความวิธีใช้สำหรับทดสอบ\nบรรทัดที่สอง");
    await page.locator("#drug-warnings").fill("ข้อความคำเตือนสำหรับทดสอบ");
    await expect(page.getByRole("article", { name: "ฉลากยา" })).toContainText("ทดสอบฉลาก");
    await expect(page.getByRole("article", { name: "ฉลากยา" })).toContainText("บรรทัดที่สอง");
    await expect(page.getByRole("article", { name: "ฉลากยา" })).toContainText("รูปแบบยา: ยาเม็ด");
    await expect(page.getByRole("article", { name: "ฉลากยา" })).toContainText("จำนวน 2 เม็ด");
    await page.getByRole("button", { name: "บันทึกและเปิดฉลากยา", exact: true }).click();
    await expect(page).toHaveURL(`http://localhost:3000/dispensing/${labelId}`);
    await page.reload();
    await expect(page.getByRole("article", { name: "ฉลากยา" })).toContainText(hn);
    await expect(page.getByRole("article", { name: "ฉลากยา" })).toContainText("รูปแบบยา: ยาเม็ด");
    await expect(page.getByRole("article", { name: "ฉลากยา" })).toContainText("จำนวน 2 เม็ด");
    await page.evaluate(() => { window.print = () => { document.body.dataset.printed = "yes"; }; });
    await page.getByRole("button", { name: "พิมพ์ฉลากยา", exact: true }).click();
    expect(await page.locator("body").getAttribute("data-printed")).toBe("yes");
    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".sidebar")).toBeHidden();
    await expect(page.locator(".drug-label")).toBeVisible();
    await page.locator(".drug-label").screenshot({ path: "test-results/drug-label-print.png" });
    await page.emulateMedia({ media: "screen" });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("http://localhost:3000/settings");
    await page.locator("#admin-name").fill("แอดมินทดสอบระบบ");
    await page.locator("#admin-email").fill(email);
    await page.locator("#admin-password").fill(password);
    await page.locator("#admin-confirm-password").fill("Does-not-match-123");
    await page.getByRole("button", { name: "เพิ่มแอดมิน", exact: true }).click();
    await expect(page.locator(".admin-management .form-error")).toContainText("ไม่ตรงกัน");
    await page.locator("#admin-confirm-password").fill(password);
    await page.getByRole("button", { name: "เพิ่มแอดมิน", exact: true }).click();
    await expect(page.locator(".admin-management .form-feedback")).toContainText("เพิ่มแอดมินเรียบร้อยแล้ว");
    await expect(page.locator(".admin-list")).toContainText(email);
    await expect(page.locator("#admin-password")).toHaveValue("");
    const created = await getDatabase().query("SELECT u.role, a.password FROM rom_auth_user u JOIN rom_auth_account a ON a.\"userId\" = u.id WHERE u.email = $1", [email]);
    expect(created.rows[0].role).toBe("admin");
    expect(created.rows[0].password).not.toBe(password);
    const newContext = await browser.newContext();
    const newAdmin = await newContext.newPage();
    await newAdmin.goto("http://localhost:3000/login");
    await newAdmin.getByLabel("อีเมลผู้ดูแลระบบ").fill(email);
    await newAdmin.getByLabel("รหัสผ่าน", { exact: true }).fill(password);
    await newAdmin.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await expect(newAdmin).toHaveURL(/\/dashboard$/);
    await newAdmin.goto("http://localhost:3000/settings");
    await expect(newAdmin.getByRole("heading", { name: "ตั้งค่าระบบ", exact: true })).toBeVisible();
    await newContext.close();
    console.log("PASS: dispensing selection, label preview/save/reload/print, mobile layout, admin validation, hashed credentials, new admin login and settings access.");
  } finally {
    if (labelId) await getDatabase().query("DELETE FROM rom_dispensing WHERE id = $1 AND patient_id = $2", [labelId, patientId]);
    await getDatabase().query("DELETE FROM rom_medicine WHERE id=$1",[medicineId]);
    if (patientId) await getDatabase().query("DELETE FROM rom_patient WHERE id = $1 AND hn = $2", [patientId, hn]);
    await getDatabase().query("DELETE FROM rom_auth_user WHERE email = $1", [email]);
    await browser.close();
    await closeDatabase();
  }
}
void main().catch(error => { console.error(error.message); process.exitCode = 1; });
