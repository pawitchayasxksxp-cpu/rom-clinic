import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getBodyChart } from "@/lib/body-charts";
import { bangkokToday } from "@/lib/calendar";
import { PageHeading } from "@/components/page-ui";
import { BodyChartForm } from "@/components/body-chart-form";
export const instant = false;
export const metadata = { title: "แก้ไข Body Chart | ROM Clinic" };
export default async function EditBodyChart({params}: {params: Promise<{id:string}>}) {
  const user = await requireAdmin();
  const {id} = await params;
  const chart = await getBodyChart(id);
  if (!chart) notFound();
  return <><PageHeading eyebrow="EDIT BODY CHART" title="แก้ไข Body Chart" description={`${chart.hn} · ${chart.patient_name}`} /><section className="panel"><BodyChartForm patientId={chart.patient_id} recordKey={chart.id} date={bangkokToday()} provider={user.name} initial={chart} /></section></>;
}
