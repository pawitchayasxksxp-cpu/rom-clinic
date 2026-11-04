import { History } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { ComingSoon, EmptyState, PageHeading } from "@/components/page-ui";

export const instant = false;
export const metadata = { title: "ประวัติประจำวัน | ROM Clinic" };
export default async function HistoryPage() {
  await requireAdmin();
  return (
    <>
      <PageHeading
        eyebrow="DAILY HISTORY"
        title="ประวัติประจำวัน"
        description="ตรวจสอบรายการรับบริการที่เสร็จสิ้นและรายการที่ยกเลิก"
      >
        <ComingSoon />
      </PageHeading>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              <History size={19} />
              ประวัติการให้บริการ
            </h2>
            <p>ข้อมูลประจำวัน ตามเวลาประเทศไทย</p>
          </div>
        </div>
        <div className="filter-bar">
          <label htmlFor="history-date">วันที่รับบริการ</label>
          <input id="history-date" type="date" disabled />
          <label htmlFor="history-status">สถานะ</label>
          <select id="history-status" disabled>
            <option>ทุกสถานะ</option>
            <option>เสร็จสิ้น</option>
            <option>ยกเลิก</option>
          </select>
        </div>
        <EmptyState
          title="ยังไม่มีประวัติการให้บริการ"
          description="รายการเสร็จสิ้นและยกเลิกจะพร้อมให้ตรวจสอบเมื่อเปิดระบบคิว"
        />
      </section>
    </>
  );
}
