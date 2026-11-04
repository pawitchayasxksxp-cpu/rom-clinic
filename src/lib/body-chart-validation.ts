import { clinicalIdentity } from "./clinical-validation";
import { bangkokToday, isCalendarDate } from "./calendar";
export type BodyPoint = { x: number; y: number; note: string };
export function validateBodyChart(form: FormData) {
  const identity = clinicalIdentity(form);
  const date = form.get("chart-date"), note = form.get("note"), provider = form.get("provider"), raw = form.get("points");
  if (!identity || typeof date !== "string" || !isCalendarDate(date) || date > bangkokToday() || typeof note !== "string" || note.length > 2000 || typeof provider !== "string" || !provider.trim() || provider.length > 254 || typeof raw !== "string" || raw.length > 25000) return { error: "กรุณาตรวจสอบวันที่ ผู้บันทึก และข้อความให้ถูกต้อง" };
  let points: BodyPoint[];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 50) return { error: "กรุณาระบุตำแหน่งบนภาพอย่างน้อย 1 จุด และไม่เกิน 50 จุด" };
    points = [];
    for (const point of parsed) {
      if (!point || typeof point !== "object" || typeof point.x !== "number" || !Number.isFinite(point.x) || point.x < 0 || point.x > 1084 || typeof point.y !== "number" || !Number.isFinite(point.y) || point.y < 0 || point.y > 782 || typeof point.note !== "string" || point.note.length > 500) return { error: "ข้อมูลตำแหน่งไม่ถูกต้อง" };
      points.push({ x: point.x, y: point.y, note: point.note.trim() });
    }
  } catch { return { error: "ข้อมูลตำแหน่งไม่ถูกต้อง" }; }
  return { data: { ...identity, date, note: note.trim(), provider: provider.trim(), points } };
}
