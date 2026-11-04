"use client";

import { startTransition, useActionState } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { createBooking } from "@/app/(admin)/calendar/actions";
import { departments } from "@/lib/navigation";

export function BookingForm({ date, bookingKey }: { date: string; bookingKey: string }) {
  const [state, action, pending] = useActionState(createBooking, { error: "" });
  return <section className="panel booking-form-panel" id="new-booking">
    <h2><CalendarPlus size={20} /> เพิ่มการจองนัดหมาย</h2>
    <form className="registration-form" onSubmit={event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      startTransition(() => action(data));
    }} aria-busy={pending}>
      <input type="hidden" name="booking-key" value={bookingKey} />
      <fieldset disabled={pending}>
        <div className="field-grid">
          <div className="field"><label htmlFor="booking-hn">HN ผู้ป่วย <span>*</span></label><input id="booking-hn" name="hn" required maxLength={30} placeholder="เช่น ROM-00000001" /><p className="form-note"><Link href="/registration">ค้นหา HN จากรายชื่อผู้ป่วย</Link></p></div>
          <div className="field"><label htmlFor="booking-department">แผนก <span>*</span></label><select id="booking-department" name="department" required defaultValue=""><option value="" disabled>เลือกแผนก</option>{departments.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>
          <div className="field"><label htmlFor="booking-date">วันที่นัดหมาย <span>*</span></label><input id="booking-date" name="date" type="date" required defaultValue={date} min="1900-01-01" max="2100-12-31" /></div>
          <div className="field"><label htmlFor="booking-time">เวลานัดหมาย (เวลาไทย) <span>*</span></label><input id="booking-time" name="time" type="time" required /></div>
        </div>
        <div className="field"><label htmlFor="booking-note">หมายเหตุการนัดหมาย</label><textarea id="booking-note" name="note" rows={2} maxLength={1000} placeholder="เช่น นัดติดตามอาการ" /></div>
        {state.error && <p role="alert" className="form-error">{state.error}</p>}
        <button type="submit" className="button button-primary" disabled={pending}>{pending ? "กำลังบันทึก…" : "บันทึกการจอง"}</button>
      </fieldset>
    </form>
  </section>;
}
