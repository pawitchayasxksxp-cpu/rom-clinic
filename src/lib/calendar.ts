import { departments } from "./navigation";

export function bangkokToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1900-01-01" || value > "2100-12-31") return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function calendarMonth(date: string) {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7)) - 1;
  const first = new Date(Date.UTC(year, month, 1));
  const start = new Date(first);
  start.setUTCDate(1 - first.getUTCDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const value = new Date(start);
    value.setUTCDate(start.getUTCDate() + index);
    return value.toISOString().slice(0, 10);
  });
  return {
    days,
    first: first.toISOString().slice(0, 10),
    previous: new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10),
    next: new Date(Date.UTC(year, month + 1, 1)).toISOString().slice(0, 10),
    end: new Date(Date.UTC(year, month + 1, 1)).toISOString().slice(0, 10),
    label: new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric", timeZone: "UTC" }).format(first),
  };
}

export function validateBooking(form: FormData) {
  const data: Record<string, string> = {};
  for (const key of ["hn", "date", "time", "department", "note", "booking-key"]) {
    const value = form.get(key);
    if (typeof value !== "string") return { error: "กรุณากรอกข้อมูลการจองให้ครบ" };
    data[key] = value.trim();
  }
  if (!/^[A-Za-z0-9/-]{1,30}$/.test(data.hn)) return { error: "กรุณาระบุ CN ของผู้ป่วยที่ลงทะเบียนแล้ว" };
  if (!isCalendarDate(data.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time)) return { error: "วันที่หรือเวลานัดหมายไม่ถูกต้อง" };
  if (new Date(`${data.date}T${data.time}:00+07:00`).getTime() <= Date.now()) return { error: "กรุณาเลือกวันและเวลานัดหมายในอนาคต" };
  if (!departments.some(item => item.code === data.department)) return { error: "กรุณาเลือกแผนก" };
  if (data.note.length > 1000) return { error: "หมายเหตุยาวได้ไม่เกิน 1,000 ตัวอักษร" };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data["booking-key"])) return { error: "กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง" };
  return { data };
}
