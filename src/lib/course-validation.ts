export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateCourse(form: FormData) {
  const name = form.get("name"), price = form.get("price"), description = form.get("description"), id = form.get("course-id");
  if (typeof id !== "string" || !uuidPattern.test(id) || typeof name !== "string" || !name.trim() || name.trim().length > 200 || typeof description !== "string" || description.trim().length > 2000) return { error: "กรุณากรอกชื่อคอร์สให้ถูกต้อง และคำอธิบายไม่เกิน 2,000 ตัวอักษร" };
  if (typeof price !== "string" || !/^\d{1,9}(\.\d{1,2})?$/.test(price) || !Number.isFinite(Number(price))) return { error: "ราคาต้องเป็นจำนวนตั้งแต่ 0 และมีทศนิยมไม่เกิน 2 ตำแหน่ง" };
  const sessions = form.get("total-sessions") ?? "1", validity = form.get("validity-days") ?? "";
  if (typeof sessions !== "string" || !/^[1-9]\d{0,3}$/.test(sessions) || typeof validity !== "string" || (validity !== "" && (!/^[1-9]\d{0,3}$/.test(validity) || Number(validity)>3650))) return {error:"จำนวนครั้งต้องเป็น 1–9999 และอายุคอร์ส 1–3650 วัน หรือเว้นว่าง"};
  return { data: { id, name: name.trim(), price, description: description.trim(), totalSessions: Number(sessions), validityDays: validity ? Number(validity) : null } };
}
