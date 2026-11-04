import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getPatient } from "@/lib/patients";
import { listBodyCharts } from "@/lib/body-charts";
import { PageHeading } from "@/components/page-ui";
export const instant = false;
export const metadata = { title: "Body Chart ผู้ป่วย | ROM Clinic" };
export default async function PatientBodyCharts({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }) {
  await requireAdmin(); const { id } = await params; const patient = await getPatient(id); if (!patient) notFound();
  const query = await searchParams; const page = Math.min(100000, Math.max(1, Number.parseInt(query.page || "1", 10) || 1));
  const { charts, hasNext } = await listBodyCharts(id, page);
  return <><PageHeading eyebrow="PATIENT BODY CHART" title="Body Chart" description={`${patient.hn} · ${patient.first_name} ${patient.last_name}`}><div className="registration-action-buttons"><Link href={`/registration/${id}/body-chart/new`} className="button button-primary"><Plus size={18} />เพิ่ม Body Chart</Link><Link href={`/registration/${id}`} className="button button-secondary">กลับรายละเอียดผู้ป่วย</Link></div></PageHeading><section className="panel"><div className="panel-header"><h2>ประวัติ Body Chart ของผู้ป่วย</h2></div>{charts.length ? <ul className="body-chart-records">{charts.map(chart => <li key={chart.id}><div><strong>{chart.date}</strong><p>{chart.provider} · {chart.count} จุด</p></div><Link href={`/body-charts/${chart.id}`} className="button button-secondary">ดู Body Chart</Link></li>)}</ul> : <div className="empty-state"><h3>ยังไม่มี Body Chart</h3><p>กดเพิ่ม Body Chart เพื่อบันทึกตำแหน่งและรายละเอียดของผู้ป่วย</p></div>}{(page > 1 || hasNext) && <nav className="patient-pagination" aria-label="หน้า Body Chart">{page > 1 && <Link className="button button-secondary" href={`/registration/${id}/body-chart?page=${page - 1}`}>หน้าก่อนหน้า</Link>}<span>หน้า {page}</span>{hasNext && <Link className="button button-secondary" href={`/registration/${id}/body-chart?page=${page + 1}`}>หน้าถัดไป</Link>}</nav>}</section></>;
}
