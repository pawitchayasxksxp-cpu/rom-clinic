"use client";
import {useState} from 'react';
import {FileDown,Printer} from 'lucide-react';
import {waitForPrintContent} from '@/lib/print-ready';
export function DocumentPrintButtons({selector}:{selector:string}){
 const[error,setError]=useState(''),[pending,setPending]=useState(false);
 const print=async()=>{setError('');setPending(true);try{await waitForPrintContent(selector);window.print();}catch(error){setError(error instanceof Error?error.message:'เปิดหน้าต่างพิมพ์ไม่สำเร็จ');}finally{setPending(false);}};
 return <div className="document-print-buttons"><div className="registration-action-buttons"><button type="button" className="button button-secondary" disabled={pending} onClick={print}><FileDown size={18}/>ส่งออก PDF</button><button type="button" className="button button-primary" disabled={pending} onClick={print}><Printer size={18}/>สั่งพิมพ์</button></div><p className="form-note">ส่งออก PDF: เลือกบันทึกเป็น PDF ในหน้าต่างพิมพ์</p>{error&&<p role="alert" className="form-error">{error}</p>}</div>;
}
