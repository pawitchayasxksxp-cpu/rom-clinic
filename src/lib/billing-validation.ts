import { uuidPattern } from "./course-validation";
import { cents, lineCents, moneyLimit } from "./money";
export type ChargeInput = {kind:"service"|"course"|"dispensing";sourceId:string;name:string;quantity:string;price:string;sessions?:number;validityDays?:number|null};
export type Charge = ChargeInput & {amount:string};
export function validatePayment(form: FormData) {
  const text = (key:string,max=500) => {const value=form.get(key);if(typeof value!=="string"||value.trim().length>max)throw new Error("ข้อมูลรับเงินไม่ถูกต้อง");return value.trim();};
  const key=text("payment-key",36),patientId=text("patient-id",19),method=text("method",10);
  if(!uuidPattern.test(key)||!/^[1-9]\d{0,18}$/.test(patientId)||BigInt(patientId)>BigInt("9223372036854775807")||!["cash","transfer"].includes(method))throw new Error("กรุณาเลือกผู้ป่วยและวิธีชำระเงิน");
  const raw=text("items",20000);let parsed:unknown;try{parsed=JSON.parse(raw);}catch{throw new Error("รายการรับเงินไม่ถูกต้อง");}
  if(!Array.isArray(parsed)||parsed.length<1||parsed.length>50)throw new Error("กรุณาเพิ่มรายการ 1–50 รายการ");
  const seen=new Set<string>();const items:ChargeInput[]=[];let sum=0;
  for(const item of parsed){
    if(!item||typeof item!=="object"||!["service","course","dispensing"].includes(item.kind)||typeof item.sourceId!=="string"||typeof item.name!=="string"||!item.name.trim()||item.name.length>200||typeof item.quantity!=="string"||typeof item.price!=="string")throw new Error("รายการรับเงินไม่ถูกต้อง");
    if(item.kind!=="service") {if(!uuidPattern.test(item.sourceId)||seen.has(`${item.kind}-${item.sourceId}`))throw new Error("รายการซ้ำหรือไม่ถูกต้อง");seen.add(`${item.kind}-${item.sourceId}`);}
    if(item.kind==="course"&&(!Number.isInteger(item.sessions)||item.sessions<1||item.sessions>9999||(item.validityDays!==null&&(!Number.isInteger(item.validityDays)||item.validityDays<1||item.validityDays>3650))))throw new Error("ข้อมูลจำนวนครั้งคอร์สไม่ถูกต้อง กรุณาโหลดหน้าใหม่");
    if(item.kind==="course"&&item.quantity!=="1")throw new Error("ซื้อคอร์สได้รายการละ 1 คอร์ส");
    sum+=lineCents(item.price,item.quantity);if(sum>moneyLimit)throw new Error("ยอดรวมเกินขอบเขตที่รองรับ");
    items.push({...item,name:item.name.trim()});
  }
  const discount=cents(text("discount",20)),received=cents(text("received",20)),note=text("note"),reference=text("reference",200);
  if(discount>sum)throw new Error("ส่วนลดต้องไม่เกินยอดรวม");
  if(discount>0&&!note)throw new Error("กรุณาระบุเหตุผลส่วนลดในหมายเหตุ");
  if(received<sum-discount)throw new Error("ยอดรับเงินไม่เพียงพอ");
  if(method==="transfer"&&received!==sum-discount)throw new Error("ยอดโอนต้องตรงกับยอดชำระ");
  return {key,patientId,method:method as "cash"|"transfer",items,discount,received,note,reference};
}
