import Link from "next/link";
import { Plus, Search, UsersRound } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { listPatients } from "@/lib/patients";
import { departments } from "@/lib/navigation";
import { PageHeading } from "@/components/page-ui";

export const instant = false;
export const metadata = { title: "รายชื่อผู้ป่วย | ROM Clinic" };

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; saved?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const search = (typeof params.q === "string" ? params.q : "").trim().slice(0, 100);
  const page = Math.min(100000, Math.max(1, Number.parseInt(params.page || "1", 10) || 1));
  const { patients, hasNext } = await listPatients(search, page);
  const pageUrl = (value: number) => `/registration?${new URLSearchParams({ q: search, page: String(value) })}`;
  return <>
    <PageHeading eyebrow="PATIENT DIRECTORY" title="รายชื่อผู้ป่วย" description="ค้นหาและดูรายชื่อผู้ป่วยที่ลงทะเบียนในคลินิก">
      <Link href="/registration/new" className="button button-primary"><Plus size={18} />ลงทะเบียนผู้ป่วย</Link>
    </PageHeading>
    {params.saved === "1" && <p className="form-feedback" role="status">บันทึกข้อมูลผู้ป่วยเรียบร้อยแล้ว</p>}
    <section className="panel">
      <div className="panel-header"><h2><UsersRound size={20} />รายชื่อผู้ป่วย</h2></div>
      <form className="patient-search" action="/registration" method="get">
        <label htmlFor="patient-search">ค้นหาผู้ป่วย</label>
        <div><input id="patient-search" name="q" defaultValue={search} maxLength={100} placeholder="ชื่อ นามสกุล HN หรือเบอร์โทรศัพท์" /><button className="button button-primary" type="submit"><Search size={17} />ค้นหา</button>{search && <Link href="/registration" className="button button-secondary">ล้างค้นหา</Link>}</div>
      </form>
      {patients.length ? <div className="patient-table-scroll"><table className="patient-table">
        <caption className="sr-only">รายชื่อผู้ป่วย หน้า {page}</caption>
        <thead><tr><th scope="col">HN</th><th scope="col">ชื่อ–นามสกุล</th><th scope="col">โทรศัพท์</th><th scope="col">แผนก</th><th scope="col">วันที่ลงทะเบียน</th></tr></thead>
        <tbody>{patients.map(patient => <tr key={patient.id}><td>{patient.hn}</td><td>{patient.first_name} {patient.last_name}</td><td>{patient.phone}</td><td>{departments.find(item => item.code === patient.department)?.name}</td><td>{patient.registered_date}</td></tr>)}</tbody>
      </table></div> : <div className="empty-state"><span className="empty-icon"><UsersRound size={28} /></span><h3>{search ? "ไม่พบผู้ป่วยที่ค้นหา" : "ยังไม่มีรายชื่อผู้ป่วย"}</h3><p>{search ? "ลองค้นหาด้วยชื่อ HN หรือเบอร์โทรศัพท์อื่น" : "กดปุ่มลงทะเบียนผู้ป่วยเพื่อเพิ่มข้อมูลผู้ป่วยคนแรก"}</p></div>}
      {(page > 1 || hasNext) && <nav className="patient-pagination" aria-label="หน้ารายชื่อผู้ป่วย">{page > 1 && <Link className="button button-secondary" href={pageUrl(page - 1)}>หน้าก่อนหน้า</Link>}<span>หน้า {page}</span>{hasNext && <Link className="button button-secondary" href={pageUrl(page + 1)}>หน้าถัดไป</Link>}</nav>}
    </section>
  </>;
}
