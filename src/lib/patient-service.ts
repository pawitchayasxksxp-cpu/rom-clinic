export const patientServices = [
  { value: "walk-in", label: "Walk-in" },
  { value: "course", label: "ซื้อคอร์ส" },
] as const;

export function patientServiceLabel(value: unknown) {
  return patientServices.find(item => item.value === value)?.label || "ยังไม่ระบุ";
}
