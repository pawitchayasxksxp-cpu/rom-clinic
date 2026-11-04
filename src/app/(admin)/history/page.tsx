import { History } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { exportData } from "@/lib/export-data";
import { bangkokToday, isCalendarDate } from "@/lib/calendar";
import { PageHeading } from "@/components/page-ui";
export const instant = false;
export const metadata = { title: "ประวัติประจำวัน | ROM Clinic" };
export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requireAdmin(); const query = await searchParams; const date = isCalendarDate(query.date || "") ? query.date! : bangkokToday(); const [report] = await exportData("activity",new URLSearchParams({date}));
  return <><PageHeading eyebrow="DAILY HISTORY" title="ประวัติประจำวัน" description="ตรวจสอบบันทึกการรักษา การจ่ายยา ใบรับรอง และ Body Chart"/><section className="panel"><div className="panel-header"><h2><History size={19}/>ประวัติการให้บริการ</h2></div><form className="filter-bar" action="/history" method="get"><label htmlFor="history-date">วันที่รับบริการ (เวลาไทย)</label><input id="history-date" name="date" type="date" defaultValue={date}/><button className="button button-secondary" type="submit">แสดง</button></form>{report.rows.length ? <div className="patient-table-scroll"><table className="patient-table"><thead><tr>{report.columns.map(([key,label])=><th key={key} scope="col">{label}</th>)}</tr></thead><tbody>{report.rows.map((row,index)=><tr key={index}>{report.columns.map(([key])=><td key={key}>{row[key]}</td>)}</tr>)}</tbody></table></div> : <div className="empty-state"><h3>ยังไม่มีประวัติในวันที่เลือก</h3></div>}</section></>;
}
