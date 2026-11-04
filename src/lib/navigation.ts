export const navigation = [
  { href: "/dashboard", label: "ภาพรวม", icon: "dashboard" },
  { href: "/registration", label: "ลงทะเบียนผู้ป่วย", icon: "registration" },
  { href: "/queues", label: "จัดการคิว", icon: "queues" },
  { href: "/history", label: "ประวัติประจำวัน", icon: "history" },
  { href: "/display", label: "จอแสดงคิว", icon: "display" },
  { href: "/settings", label: "ตั้งค่าระบบ", icon: "settings" },
] as const;
export const departments = [
  {
    code: "GN",
    name: "ทั่วไป",
    caption: "General medicine",
    className: "teal",
  },
  { code: "DT", name: "ทันตกรรม", caption: "Dental care", className: "blue" },
  { code: "ER", name: "ฉุกเฉิน", caption: "Emergency", className: "rose" },
  { code: "PD", name: "กุมารเวช", caption: "Pediatrics", className: "amber" },
] as const;
