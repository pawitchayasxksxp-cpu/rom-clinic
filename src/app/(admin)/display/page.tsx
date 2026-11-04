import { HeartPulse, Volume2 } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { departments } from "@/lib/navigation";
import { ComingSoon, PageHeading } from "@/components/page-ui";

export const instant = false;
export const metadata = { title: "จอแสดงคิว | ROM Clinic" };
export default async function DisplayPage() {
  await requireAdmin();
  return (
    <>
      <PageHeading
        eyebrow="WAITING ROOM DISPLAY"
        title="จอแสดงคิว"
        description="หน้าตั้งต้นสำหรับจอในพื้นที่รอรับบริการ"
      >
        <ComingSoon />
      </PageHeading>
      <section className="display-board">
        <div className="display-heading">
          <span>
            <HeartPulse size={25} />
            ROM Clinic
          </span>
          <span>
            <Volume2 size={18} />
            กรุณารอเจ้าหน้าที่เรียกหมายเลขคิว
          </span>
        </div>
        <div className="display-message">
          <span className="eyebrow">ขณะนี้กำลังให้บริการ</span>
          <strong>รอเรียกคิว</strong>
          <p>ยังไม่มีหมายเลขที่กำลังเรียก</p>
        </div>
        <div className="display-departments">
          {departments.map((item) => (
            <div key={item.code}>
              <span className={`department-code ${item.className}`}>
                {item.code}
              </span>
              <h2>{item.name}</h2>
              <strong>—</strong>
              <span>กำลังรอให้บริการ</span>
            </div>
          ))}
        </div>
        <div className="display-footer">
          ขอบคุณที่ให้เราดูแลคุณ · หน้านี้ยังเป็นหน้าตั้งต้นสำหรับผู้ดูแลระบบ
        </div>
      </section>
    </>
  );
}
