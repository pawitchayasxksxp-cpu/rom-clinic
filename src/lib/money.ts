export const moneyLimit = 99_999_999_999;
export function cents(value: string): number {
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(value)) throw new Error("จำนวนเงินต้องเป็นเลขตั้งแต่ 0 และมีทศนิยมไม่เกิน 2 ตำแหน่ง");
  const [whole,fraction=""] = value.split(".");
  return Number(whole)*100+Number(fraction.padEnd(2,"0"));
}
export function decimal(value: number) { return `${Math.floor(value/100)}.${String(value%100).padStart(2,"0")}`; }
export function lineCents(price: string, quantity: string) {
  const count = cents(quantity);
  if (!count || count > 99_999_999) throw new Error("จำนวนต้องมากกว่า 0 และไม่เกิน 999,999.99");
  const result = (BigInt(cents(price))*BigInt(count)+BigInt(50))/BigInt(100);
  if (result>BigInt(moneyLimit)) throw new Error("ยอดเงินเกินขอบเขตที่รองรับ");
  return Number(result);
}
export const baht = (value: string | number) => new Intl.NumberFormat("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value));
