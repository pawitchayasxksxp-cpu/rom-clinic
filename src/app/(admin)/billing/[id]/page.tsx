import Link from 'next/link';
import Image from 'next/image';
import {notFound} from 'next/navigation';
import {requireAdmin} from '@/lib/session';
import {getReceipt} from '@/lib/billing';
import {baht} from '@/lib/money';
import {PageHeading} from '@/components/page-ui';
import {PrintLabelButton} from '@/components/print-label-button';
export const instant=false;
export const metadata={title:'ใบเสร็จรับเงิน | ROM Clinic'};
export default async function ReceiptPage({params}:{params:Promise<{id:string}>}){
 await requireAdmin();const {id}=await params;const receipt=await getReceipt(id);if(!receipt)notFound();
 return <div className="receipt-print-page"><PageHeading eyebrow="PAYMENT RECEIPT" title="ใบเสร็จรับเงิน" description={receipt.number}><PrintLabelButton label="พิมพ์ใบเสร็จ"/></PageHeading><div className="print-actions"><Link href="/billing" className="button button-secondary">กลับหน้าชำระเงิน</Link><Link href={`/registration/${receipt.patient_id}`} className="button button-secondary">รายละเอียดผู้ป่วย</Link></div>
 <article className="panel saved-receipt" aria-label="ใบเสร็จรับเงิน"><header className="receipt-header"><Image src="/clinic-logo.jpg" alt="ROM Clinic" width={100} height={100}/><div><h2>ROM Clinic</h2><p>ใบเสร็จรับเงิน</p><strong>{receipt.number}</strong><p>วันที่ {receipt.date}</p></div></header><div className="receipt-patient"><p>ผู้ชำระเงิน: {receipt.patient_name}</p><p>CN: {receipt.hn}</p></div>
 <table className="receipt-items"><thead><tr><th>รายการ</th><th>จำนวน</th><th>ราคา / หน่วย</th><th>รวม (บาท)</th></tr></thead><tbody>{receipt.items.map((item,index)=><tr key={index}><td>{item.name}</td><td>{item.quantity}</td><td>{baht(item.price)}</td><td>{baht(item.amount)}</td></tr>)}</tbody></table>
 <dl className="receipt-totals"><div><dt>ยอดรวม</dt><dd>{baht(receipt.subtotal)} บาท</dd></div><div><dt>ส่วนลด</dt><dd>{baht(receipt.discount)} บาท</dd></div><div><dt>ยอดชำระสุทธิ</dt><dd>{baht(receipt.total)} บาท</dd></div><div><dt>{receipt.method==='cash'?'รับเงินสด':'รับเงินโอน'}</dt><dd>{baht(receipt.received)} บาท</dd></div>{receipt.method==='cash'&&<div><dt>เงินทอน</dt><dd>{baht(receipt.change)} บาท</dd></div>}</dl>
 {receipt.reference&&<p className="receipt-note">เลขอ้างอิง: {receipt.reference}</p>}{receipt.note&&<p className="receipt-note">หมายเหตุ: {receipt.note}</p>}<footer><p>ผู้รับเงิน: {receipt.cashier}</p><p>ขอบคุณที่ใช้บริการ ROM Clinic</p></footer></article></div>;
}
