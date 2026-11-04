export const navigation = [
  { href: "/dashboard", label: "ภาพรวม", icon: "dashboard" },
  { href: "/registration", label: "รายชื่อผู้ป่วย", icon: "registration" },
  { href: "/calendar", label: "ปฏิทินการจอง", icon: "calendar" },
  { href: "/dispensing", label: "จ่ายยา", icon: "dispensing" },
  { href: "/queues", label: "จัดการคิว", icon: "queues" },
  { href: "/history", label: "ประวัติประจำวัน", icon: "history" },
  { href: "/display", label: "จอแสดงคิว", icon: "display" },
  { href: "/settings", label: "ตั้งค่าระบบ", icon: "settings" },
] as const;
export const departments = [
  { code: "GN", name: "ตรวจโรคทั่วไป", caption: "General medicine", className: "teal" },
  { code: "MS", name: "นวดกดจุดรักษาโรคกล้ามเนื้อ ข้อต่อ กระดูก", caption: "Musculoskeletal massage", className: "blue" },
  { code: "SP", name: "นวดสปอร์ตและฟื้นฟูนักกีฬา", caption: "Sports massage & rehabilitation", className: "rose" },
  { code: "TM", name: "เวชกรรมแพทย์แผนไทย", caption: "Thai traditional medicine", className: "amber" },
] as const;

// Historical codes remain readable, but are not offered for new registrations.
const legacyDepartmentNames: Record<string, string> = { DT: "ทันตกรรม", ER: "ฉุกเฉิน", PD: "กุมารเวช" };
export function departmentName(code: string) {
  return departments.find(item => item.code === code)?.name || legacyDepartmentNames[code] || code;
}
