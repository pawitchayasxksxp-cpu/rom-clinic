import { CircleCheck, ListOrdered, Megaphone, XCircle } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { ComingSoon, EmptyState, PageHeading } from "@/components/page-ui";
import { departments } from "@/lib/navigation";

export const instant = false;
export const metadata = { title: "จัดการคิว | ROM Clinic" };
export default async function QueuesPage() {
  await requireAdmin();
  return (
    <>
      <PageHeading
        eyebrow="QUEUE MANAGEMENT"
        title="จัดการคิว"
        description="ติดตามคิวรอตรวจ เรียกผู้ป่วย และจบการให้บริการ"
      >
        <ComingSoon />
      </PageHeading>
      <div className="workflow-strip">
        {[
          {
            icon: Megaphone,
            title: "เรียกคิว",
            description: "เปลี่ยนสถานะเป็นกำลังตรวจ",
            color: "teal",
          },
          {
            icon: CircleCheck,
            title: "เสร็จสิ้น",
            description: "บันทึกการรับบริการเรียบร้อย",
            color: "blue",
          },
          {
            icon: XCircle,
            title: "ยกเลิก",
            description: "ผู้ป่วยไม่อยู่หรือสละสิทธิ์",
            color: "rose",
          },
        ].map((item) => (
          <div key={item.title}>
            <span className={`stat-icon ${item.color}`}>
              <item.icon size={20} />
            </span>
            <span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </span>
          </div>
        ))}
      </div>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              <ListOrdered size={19} />
              รายการคิว
            </h2>
            <p>คิวด่วนก่อน จากนั้นเรียงตามเวลาลงทะเบียน</p>
          </div>
        </div>
        <div className="filter-bar">
          <label htmlFor="queue-department">แผนก</label>
          <select id="queue-department" disabled>
            <option>ทุกแผนก</option>
            {departments.map((item) => (
              <option key={item.code}>{item.name}</option>
            ))}
          </select>
          <span className="queue-legend">
            <span className="mini-dot teal" />
            ปกติ
            <span className="mini-dot rose" />
            ด่วน
          </span>
        </div>
        <EmptyState
          title="ยังไม่เปิดระบบจัดการคิว"
          description="เมื่อเปิดใช้งาน รายการผู้ป่วยและปุ่มเรียกคิวจะแสดงที่นี่"
        />
      </section>
    </>
  );
}
