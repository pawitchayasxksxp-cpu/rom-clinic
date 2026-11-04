import "server-only";
import { requireAdmin } from "./session";
import { getDatabase } from "./db";

export type Booking = {
  id: string;
  patient_id: string;
  date: string;
  time: string;
  patient_name: string;
  hn: string;
  phone: string;
  department: string;
  status: "confirmed" | "completed" | "cancelled";
  note: string;
};

export async function listBookings(start: string, end: string, department: string) {
  await requireAdmin();
  const result = await getDatabase().query<Booking>(
    `SELECT b.id, p.id::text AS patient_id, to_char(b.starts_at AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD') AS date,
      to_char(b.starts_at AT TIME ZONE 'Asia/Bangkok', 'HH24:MI') AS time,
      concat_ws(' ', p.first_name, p.last_name) AS patient_name,
      COALESCE(p.hn, 'ROM-' || lpad(p.id::text, 8, '0')) AS hn,
      p.phone, b.department, b.status, b.note
     FROM rom_booking b JOIN rom_patient p ON p.id = b.patient_id
     WHERE p.deleted_at IS NULL AND b.starts_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Bangkok')
       AND b.starts_at < ($2::date::timestamp AT TIME ZONE 'Asia/Bangkok')
       AND ($3 = '' OR b.department = $3)
     ORDER BY b.starts_at, b.id`,
    [start, end, department],
  );
  return result.rows;
}
