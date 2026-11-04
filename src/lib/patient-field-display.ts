export const patientOtherFields = ["identity-type", "title", "sex", "emergency-relationship", "coverage"] as const;
export function patientFieldDisplay(details: Record<string, unknown>, key: string) {
  const value = details[key];
  if (typeof value !== "string") return "";
  const other = details[`${key}-other`];
  return value.includes("อื่น") && typeof other === "string" && other.trim() ? other.trim() : value;
}
