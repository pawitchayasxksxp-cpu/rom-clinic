import { randomUUID } from "node:crypto";
import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { listCourses } from "@/lib/courses";
import { listMedicines } from "@/lib/medicines";
import { PageHeading } from "@/components/page-ui";
import { CourseManager } from "@/components/course-manager";
import { AdminManager } from "@/components/admin-manager";
import { MedicineManager } from "@/components/medicine-manager";
export const instant = false;
export const metadata = { title: "Master Data | ROM Clinic" };
export default async function MasterDataPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin(); const params = await searchParams; const tab = ["courses", "admins", "medicines"].includes(params.tab || "") ? params.tab! : "courses";
  return <><PageHeading eyebrow="MASTER DATA" title="Master Data" description="จัดการคอร์ส แอดมิน คลังยา และรูปภาพ" /><nav className="master-tabs" aria-label="ประเภท Master Data">{[["courses", "จัดการคอร์ส"], ["admins", "จัดการแอดมิน"], ["medicines", "คลังยา"]].map(([key, label]) => <Link key={key} href={`/master-data?tab=${key}`} className={tab === key ? "active" : ""} aria-current={tab === key ? "page" : undefined}>{label}</Link>)}</nav>{tab === "admins" ? <AdminManager /> : tab === "medicines" ? <MedicineManager medicines={await listMedicines()} newId={randomUUID()} /> : <CourseManager courses={await listCourses()} newId={randomUUID()} />}</>;
}
