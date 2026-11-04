"use client";
import { waitForPrintContent } from "@/lib/print-ready";
import { Printer } from "lucide-react";
export function PrintLabelButton({ label = "พิมพ์ฉลากยา" }: { label?: string }) {
  return <button type="button" className="button button-primary" onClick={async () => { await waitForPrintContent(); window.print(); }}><Printer size={18} />{label}</button>;
}
