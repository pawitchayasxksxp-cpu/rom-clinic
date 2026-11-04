"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { waitForPrintContent } from "@/lib/print-ready";
import { Download, FileText, Printer } from "lucide-react";
export function ExportActions() {
  const pathname=usePathname();const search=useSearchParams();const[pending,setPending]=useState(false);const[error,setError]=useState("");
  const params=new URLSearchParams(search.toString());let resource="patients";const parts=pathname.split("/").filter(Boolean);
  if(parts[0]==="registration"&&parts[1]&&parts[1]!=="new"){resource="patient";params.set("id",parts[1]);}
  else if(parts[0]==="calendar")resource="bookings";
  else if(parts[0]==="dashboard")resource="dashboard";
  else if(parts[0]==="queues"||parts[0]==="display")resource="waiting";
  else if(parts[0]==="history")resource="activity";
  else if(parts[0]==="settings")resource="system";
  else if(parts[0]==="master-data")resource=["admins","medicines"].includes(params.get("tab")||"")?params.get("tab")!:"courses";
  else if(parts[0]==="dispensing"){resource=parts[1]?"label":"dispensing";if(parts[1])params.set("id",parts[1]);}
  else if(parts[0]==="certificates"){resource="certificate";params.set("id",parts[1]||"");}
  else if(parts[0]==="body-charts"){resource="body-chart";params.set("id",parts[1]||"");}
  params.set("resource",resource);
  const print=async()=>{if(pathname==="/dispensing"){document.querySelector<HTMLButtonElement>('button[data-print="true"]')?.click();return;}try{setError("");await waitForPrintContent(pathname.startsWith("/certificates/")?".medical-certificate":pathname.startsWith("/body-charts/")?".saved-body-chart":"main .page-heading, main h1");window.print();}catch(error){setError(error instanceof Error?error.message:"พิมพ์ไม่สำเร็จ");}};
  return <div className="global-export-actions"><div><span>ส่งออกข้อมูล</span><button type="button" className="button button-secondary" onClick={print}><FileText size={16}/>PDF</button><button type="button" className="button button-secondary" disabled={pending} onClick={async()=>{setError("");setPending(true);try{const response=await fetch(`/api/exports?${params}`,{cache:"no-store"});if(!response.ok){const result=await response.json();throw new Error(result.error||"ส่งออกไม่สำเร็จ");}const url=URL.createObjectURL(await response.blob());const link=document.createElement("a");link.href=url;link.download=`rom-clinic-${resource}.xlsx`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){setError(error instanceof Error?error.message:"ส่งออกไม่สำเร็จ");}finally{setPending(false);}}}><Download size={16}/>{pending?"กำลังส่งออก…":"Excel"}</button><button type="button" className="button button-secondary" onClick={print}><Printer size={16}/>พิมพ์</button></div><small>Excel: ข้อมูลที่บันทึกแล้ว · PDF: เลือกบันทึกเป็น PDF ในหน้าต่างพิมพ์</small>{error&&<p role="alert">{error}</p>}</div>;
}
