export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateCourse(form: FormData) {
  const name = form.get("name"), price = form.get("price"), description = form.get("description"), id = form.get("course-id");
  if (typeof id !== "string" || !uuidPattern.test(id) || typeof name !== "string" || !name.trim() || name.trim().length > 200 || typeof description !== "string" || description.trim().length > 2000) return { error: "กรุณากรอกชื่อคอร์สให้ถูกต้อง และคำอธิบายไม่เกิน 2,000 ตัวอักษร" };
  if (typeof price !== "string" || !/^\d{1,9}(\.\d{1,2})?$/.test(price) || !Number.isFinite(Number(price))) return { error: "ราคาต้องเป็นจำนวนตั้งแต่ 0 และมีทศนิยมไม่เกิน 2 ตำแหน่ง" };
  return { data: { id, name: name.trim(), price, description: description.trim() } };
}
