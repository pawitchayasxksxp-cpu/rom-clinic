import { randomUUID } from "node:crypto";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { bangkokToday, calendarMonth, isCalendarDate } from "@/lib/calendar";
import { listBookings } from "@/lib/bookings";
import { departments, departmentName } from "@/lib/navigation";
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
  const url = (date: string) => `/calendar?${new URLSearchParams({ date, ...(department ? { department } : {}) })}`;
  return <>
    <PageHeading eyebrow="BOOKING CALENDAR" title="ปฏิทินการจอง" description="แสดงรายการจองบนปฏิทิน กดนัดหมายเพื่อดูรายละเอียด">
      <a href="#new-booking" className="button button-primary">เพิ่มการจอง</a>
    </PageHeading>
    {params.saved === "1" && <p className="form-feedback" role="status">บันทึกการจองเรียบร้อยแล้ว</p>}
    <section className="panel calendar-panel calendar-full" aria-label="ปฏิทินรายเดือน">
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
      <div className="calendar-legend"><span className="booking-status confirmed">ยืนยันนัด</span><span className="booking-status completed">เสร็จสิ้น</span><span className="booking-status cancelled">ยกเลิก</span><p>กดรายการจองในช่องวันที่เพื่อดูรายละเอียด</p></div>
      {bookings.length === 0 && <p className="calendar-empty-note">ยังไม่มีรายการจองในเดือนนี้ เพิ่มการจองเพื่อแสดงนัดหมายบนปฏิทิน</p>}
      <p className="calendar-scroll-hint">เลื่อนปฏิทินซ้าย–ขวาเพื่อดูครบทุกวัน</p>
      <div className="calendar-scroll" role="region" aria-label="ตารางปฏิทินการจอง" tabIndex={0}>
        <div className="calendar-month-board">
          <div className="calendar-weekdays" aria-hidden="true">{["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"].map(day => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">
            {month.days.map(date => {
              const items = bookings.filter(item => item.date === date);
              const outside = date.slice(0, 7) !== selected.slice(0, 7);
              return <div key={date} data-date={date} className={`calendar-day${outside ? " outside" : ""}${date === selected ? " selected" : ""}${date === today ? " today" : ""}`}>
                <div className="calendar-day-heading"><Link href={url(date)} className="calendar-day-number" aria-current={date === selected ? "date" : undefined} aria-label={date}>{Number(date.slice(-2))}</Link>{date === today && <small>วันนี้</small>}{items.length > 0 && <small className="calendar-day-count">{items.length} นัด</small>}</div>
                <div className="calendar-day-events">
                  {items.map(item => <details key={item.id} className={`calendar-event ${item.status}`}>
                    <summary><span className="calendar-event-time"><Clock3 size={13} />{item.time}<span>{statuses[item.status]}</span></span><strong>{item.patient_name}</strong><span className="calendar-event-department">{departmentName(item.department)}</span></summary>
                    <div className="calendar-event-details"><p>CN {item.hn}</p><p>โทร. {item.phone}</p>{item.note && <p>{item.note}</p>}</div>
                  </details>)}
                </div>
              </div>;
            })}
          </div>
        </div>
      </div>
    </section>
    <BookingForm key={selected} date={selected} bookingKey={randomUUID()} />
  </>;
}
