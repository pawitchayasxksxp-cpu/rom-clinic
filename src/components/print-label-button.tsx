"use client";
import { Printer } from "lucide-react";
export function PrintLabelButton() {
  return <button type="button" className="button button-primary" onClick={() => window.print()}><Printer size={18} />พิมพ์ฉลากยา</button>;
}
