import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getBodyChart } from "@/lib/body-charts";
import { PageHeading } from "@/components/page-ui";
import { BodyChartImage } from "@/components/body-chart-image";
import { PrintLabelButton } from "@/components/print-label-button";
export const instant = false;
export const metadata = { title: "Body Chart | ROM Clinic" };
export default async function BodyChartPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(); const { id } = await params; const chart = await getBodyChart(id); if (!chart) notFound();
  return <div className="body-chart-print-page"><PageHeading eyebrow="BODY CHART RECORD" title="Body Chart" description={`${chart.hn} · ${chart.patient_name}`}><PrintLabelButton label="พิมพ์ Body Chart" /></PageHeading><div className="print-actions"><Link href={`/registration/${chart.patient_id}/body-chart`} className="button button-secondary">กลับ Body Chart ผู้ป่วย</Link></div><article className="panel saved-body-chart" aria-label="Body Chart ที่บันทึก"><header><h2>{chart.patient_name} · {chart.hn}</h2><p>วันที่ {chart.date} · ผู้บันทึก {chart.provider}</p></header><BodyChartImage points={chart.points} /><ol>{chart.points.map((point, index) => <li key={index}><strong>จุดที่ {index + 1}:</strong> {point.note || "ไม่ได้ระบุรายละเอียด"}</li>)}</ol>{chart.note && <p className="saved-body-chart-note">{chart.note}</p>}</article></div>;
}
