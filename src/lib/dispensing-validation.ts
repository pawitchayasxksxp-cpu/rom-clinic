import { isCalendarDate } from "./calendar";

export type DrugLabelData = {
  "drug-name": string;
  strength: string;
  quantity: string;
  unit: string;
  directions: string;
  indication: string;
  warnings: string;
  storage: string;
  expiry: string;
  dispenser: string;
};

export const emptyDrugLabel: DrugLabelData = {
  "drug-name": "", strength: "", quantity: "", unit: "", directions: "",
  indication: "", warnings: "", storage: "", expiry: "", dispenser: "",
};

export function validateDispensing(form: FormData) {
  const data = { ...emptyDrugLabel };
  for (const key of Object.keys(data) as (keyof DrugLabelData)[]) {
    const value = form.get(key);
    if (typeof value !== "string") return { error: "รูปแบบข้อมูลฉลากยาไม่ถูกต้อง" };
    data[key] = value.trim();
    const limit = ["directions", "warnings", "storage", "indication"].includes(key) ? 1000 : 200;
    if (data[key].length > limit) return { error: "ข้อความบนฉลากยาวเกินกำหนด กรุณาย่อข้อความ" };
  }
  if (!data["drug-name"] || !data.directions || !data.unit || !data.dispenser) return { error: "กรุณากรอกชื่อยา หน่วย วิธีใช้ และผู้จ่ายยาให้ครบ" };
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(data.quantity) || Number(data.quantity) <= 0) return { error: "จำนวนยาต้องมากกว่า 0 และมีทศนิยมได้ไม่เกิน 2 ตำแหน่ง" };
  if (data.expiry && !isCalendarDate(data.expiry)) return { error: "วันหมดอายุไม่ถูกต้อง กรุณาระบุปี ค.ศ." };
  const hn = form.get("hn");
  const key = form.get("dispensing-key");
  if (typeof hn !== "string" || !/^[A-Za-z0-9/-]{1,30}$/.test(hn)) return { error: "กรุณาเลือกผู้ป่วยจากรายชื่อ" };
  if (typeof key !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) return { error: "กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง" };
  return { data, hn, key };
}
