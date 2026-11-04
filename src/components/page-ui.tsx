import { Inbox, Plus } from "lucide-react";
import Link from "next/link";
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function EmptyState({
  title = "ยังไม่มีรายการคิว",
  description = "รายการจะแสดงที่นี่เมื่อเริ่มลงทะเบียนผู้ป่วย",
  registration = false,
}: {
  title?: string;
  description?: string;
  registration?: boolean;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Inbox size={29} strokeWidth={1.4} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {registration && (
        <Link className="button button-secondary" href="/registration">
          <Plus size={16} />
          ลงทะเบียนผู้ป่วย
        </Link>
      )}
    </div>
  );
}
export function ComingSoon() {
  return <span className="badge badge-neutral">เตรียมเปิดใช้งาน</span>;
}
