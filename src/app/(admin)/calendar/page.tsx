import { randomUUID } from "node:crypto";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { bangkokToday, calendarMonth, isCalendarDate } from "@/lib/calendar";
import { listBookings } from "@/lib/bookings";
import { departments } from "@/lib/navigation";
import { PageHeading } from "@/components/page-ui";
import { BookingForm } from "@/components/booking-form";

export const instant = false;
export const metadata = { title: "ปฏิทินการจอง | ROM Clinic" };
const statuses = { confirmed: "ยืนยันนัด", completed: "เสร็จสิ้น", cancelled: "ยกเลิก" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ date?: string; department?: string; saved?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const today = bangkokToday();
  const selected = typeof params.date === "string" && isCalendarDate(params.date) ? params.date : today;
  const department = departments.some(item => item.code === params.department) ? params.department! : "";
  const month = calendarMonth(selected);
  const bookings = await listBookings(month.first, month.end, department);
  const daily = bookings.filter(item => item.date === selected);
  const url = (date: string) => `/calendar?${new URLSearchParams({ date, ...(department ? { department } : {}) })}`;
  const selectedLabel = new Intl.DateTimeFormat("th-TH", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${selected}T00:00:00Z`));
  return <>
    <PageHeading eyebrow="BOOKING CALENDAR" title="ปฏิทินการจอง" description="ดูนัดหมายผู้ป่วยและรายการจองตามวัน เวลา และแผนก">
      <a href="#new-booking" className="button button-primary">เพิ่มการจอง</a>
    </PageHeading>
    {params.saved === "1" && <p className="form-feedback" role="status">บันทึกการจองเรียบร้อยแล้ว</p>}
    <div className="calendar-layout">
      <section className="panel calendar-panel" aria-label="ปฏิทินรายเดือน">
        <div className="calendar-toolbar">
          <h2>{month.label}</h2>
          <div><Link href={url(month.previous)} className="icon-button" aria-label="เดือนก่อนหน้า"><ChevronLeft size={21} /></Link><Link href={url(today)} className="button button-secondary">วันนี้</Link><Link href={url(month.next)} className="icon-button" aria-label="เดือนถัดไป"><ChevronRight size={21} /></Link></div>
        </div>
        <form method="get" action="/calendar" className="calendar-filter">
          <input type="hidden" name="date" value={selected} />
          <label htmlFor="calendar-department">แผนก</label>
          <select id="calendar-department" name="department" defaultValue={department}><option value="">ทุกแผนก</option>{departments.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select>
          <button type="submit" className="button button-secondary">แสดง</button>
          <span>{bookings.length} รายการในเดือนนี้</span>
        </form>
        <div className="calendar-weekdays" aria-hidden="true">{["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."].map(day => <span key={day}>{day}</span>)}</div>
        <div className="calendar-grid">
          {month.days.map(date => {
            const items = bookings.filter(item => item.date === date);
            const outside = date.slice(0, 7) !== selected.slice(0, 7);
            return <Link key={date} href={url(date)} className={`calendar-day${outside ? " outside" : ""}${date === selected ? " selected" : ""}${date === today ? " today" : ""}`} aria-current={date === selected ? "date" : undefined} aria-label={`${date}, ${items.length} รายการ${date === today ? ", วันนี้" : ""}`}>
              <span className="calendar-day-number">{Number(date.slice(-2))}</span>
              {items.length > 0 && <span className="calendar-day-count">{items.length}<span> นัดหมาย</span></span>}
              <span className="calendar-day-events">{items.slice(0, 2).map(item => <span key={item.id} className={`calendar-event ${item.status}`}><b>{item.time}</b> {item.patient_name}</span>)}{items.length > 2 && <small>+{items.length - 2} รายการ</small>}</span>
            </Link>;
          })}
        </div>
      </section>
      <section className="panel calendar-agenda" aria-label="รายการจองวันที่เลือก">
        <div className="panel-header"><div><h2><CalendarDays size={19} />รายการจอง</h2><p>{selectedLabel} · {daily.length} รายการ</p></div></div>
        {daily.length ? <ol className="booking-list">{daily.map(item => <li key={item.id}>
          <div className="booking-time"><Clock3 size={16} />{item.time}<span className={`booking-status ${item.status}`}>{statuses[item.status]}</span></div>
          <h3>{item.patient_name}</h3><p>HN {item.hn} · {departments.find(value => value.code === item.department)?.name}</p><p>โทร. {item.phone}</p>{item.note && <p className="booking-note">{item.note}</p>}
        </li>)}</ol> : <div className="empty-state"><span className="empty-icon"><CalendarDays size={28} /></span><h3>ไม่มีรายการจองในวันนี้</h3><p>เลือกวันที่อื่น หรือเพิ่มการจองนัดหมาย</p></div>}
      </section>
    </div>
    <BookingForm key={selected} date={selected} bookingKey={randomUUID()} />
  </>;
}
