import { test, expect } from "@playwright/test";

const paths = [
  "/dashboard",
  "/registration",
  "/registration/new",
  "/calendar",
  "/queues",
  "/history",
  "/display",
  "/settings",
];
const email = process.env.ADMIN_EMAIL!;
const password = process.env.ADMIN_PASSWORD!;

test("unauthenticated users cannot open any admin page or forge a cookie", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "rom-clinic.session_token",
      value: "forged-session",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  for (const path of paths) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "ยินดีต้อนรับกลับมา" }),
    ).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "เมนูหลัก" }),
    ).toHaveCount(0);
  }
});

test("wrong password fails and public signup is disabled", async ({
  page,
  request,
}) => {
  await page.goto("/login");
  await page.screenshot({
    path: "test-results/login-desktop.png",
    fullPage: true,
    caret: "initial",
  });
  await page.getByLabel("อีเมลผู้ดูแลระบบ").fill(email);
  await page
    .getByLabel("รหัสผ่าน", { exact: true })
    .fill("WrongPassword-For-Test-Only");
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page.locator(".form-error")).toContainText(
    "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  );
  const signup = await request.post("/api/auth/sign-up/email", {
    headers: { Origin: "http://127.0.0.1:3131" },
    data: {
      name: "Unauthorized",
      email: "no-signup@example.com",
      password: "NotARealCredential123",
    },
  });
  expect(signup.status()).toBe(400);
});

test("admin can login, navigate all menus, reload, and logout revokes the session", async ({
  page,
  context,
  browser,
}) => {
  await page.goto("/login");
  await page.getByLabel("อีเมลผู้ดูแลระบบ").fill(email);
  // Do not retain traces/screenshots of credentials.
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill(password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "ภาพรวมคลินิก" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  const cookies = await context.cookies();
  const sessionCookie = cookies.find((cookie) =>
    cookie.name.endsWith("session_token"),
  );
  expect(sessionCookie?.httpOnly).toBe(true);
  expect(sessionCookie?.sameSite).toBe("Lax");
  for (const [path, title] of [
    ["/registration", "รายชื่อผู้ป่วย"],
    ["/calendar", "ปฏิทินการจอง"],
    ["/queues", "จัดการคิว"],
    ["/history", "ประวัติประจำวัน"],
    ["/display", "จอแสดงคิว"],
    ["/settings", "ตั้งค่าระบบ"],
  ]) {
    await page
      .getByRole("navigation")
      .getByRole("link", { name: title, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "ตั้งค่าระบบ", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "เปิดเมนู", exact: true }).click();
  await expect(page.locator(".sidebar.is-open")).toBeInViewport();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "ภาพรวม", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator(".sidebar.is-open")).toHaveCount(0);
  await expect(page.locator(".sidebar")).not.toBeInViewport();
  await expect(page.getByRole("heading", { name: "ภาพรวมคลินิก" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("/login");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  // Replaying the original cookie must fail after server-side revocation.
  const replay = await browser.newContext();
  await replay.addCookies(cookies);
  const replayPage = await replay.newPage();
  await replayPage.goto("http://127.0.0.1:3131/settings");
  await expect(replayPage).toHaveURL(/\/login$/);
  await replay.close();
});

test("login rate limiting and cross-origin protection are active", async ({
  request,
}) => {
  const crossOrigin = await request.post("/api/auth/sign-in/email", {
    headers: { Origin: "https://untrusted.invalid", "x-forwarded-for": "198.51.100.44" },
    data: { email, password: "not-the-password" },
  });
  expect(crossOrigin.status()).toBe(403);
  let limited = false;
  for (let attempt = 0; attempt < 6; attempt++) {
    const result = await request.post("/api/auth/sign-in/email", {
      headers: { Origin: "http://127.0.0.1:3131", "x-forwarded-for": "198.51.100.44" },
      data: { email: "nonexistent@example.com", password: "WrongPassword123" },
    });
    if (result.status() === 429) {
      limited = true;
      break;
    }
  }
  expect(limited).toBe(true);
});
