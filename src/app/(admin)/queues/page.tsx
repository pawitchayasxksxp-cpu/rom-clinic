import Link from 'next/link';
import {requireAdmin} from '@/lib/session';
import {listExaminations,examinationStatus} from '@/lib/examinations';
import {bangkokToday,isCalendarDate} from '@/lib/calendar';
import {departments,departmentName} from '@/lib/navigation';
import {PageHeading} from '@/components/page-ui';
import {DashboardRefresh} from '@/components/dashboard-refresh';
export const instant=false;
export const metadata={title:'จัดการคิวห้องตรวจ | ROM Clinic'};
export default async function QueuesPage({searchParams}:{searchParams:Promise<{date?:string;department?:string}>}){
 await requireAdmin();const query=await searchParams;const date=isCalendarDate(query.date||'')?query.date!:bangkokToday(),department=departments.some(d=>d.code===query.department)?query.department!:'';const rooms=await listExaminations(date,department);
 return <><DashboardRefresh/><PageHeading eyebrow="EXAMINATION QUEUES" title="จัดการคิวห้องตรวจ" description="คิวที่ยังไม่จบ และประวัติวันที่เลือก · แสดงสูงสุด 200 รายการ"><Link href="/registration" className="button button-primary">เลือกรายชื่อผู้ป่วย</Link></PageHeading><section className="panel"><form className="filter-bar" method="get" action="/queues"><label htmlFor="queue-date">วันที่ (ค.ศ.)</label><input id="queue-date" type="date" name="date" defaultValue={date}/><label htmlFor="queue-department">แผนก</label><select id="queue-department" name="department" defaultValue={department}><option value="">ทุกแผนก</option>{departments.map(d=><option key={d.code} value={d.code}>{d.name}</option>)}</select><button type="submit" className="button button-secondary">แสดง</button></form>{rooms.length?<div className="patient-table-scroll"><table className="patient-table"><thead><tr><th>คิว</th><th>CN</th><th>ผู้ป่วย</th><th>แผนก</th><th>ส่งห้องตรวจ</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>{rooms.map(r=><tr key={r.id}><td>{r.number}</td><td>{r.hn}</td><td>{r.name}</td><td>{departmentName(r.department)}</td><td>{r.date}</td><td>{examinationStatus[r.status]}</td><td><Link className="button button-secondary" href={`/queues/${r.id}`}>{['waiting','examining'].includes(r.status)?'เข้าห้องตรวจ':'ดูรายการ'}</Link></td></tr>)}</tbody></table></div>:<div className="empty-state"><h3>ยังไม่มีคิวห้องตรวจ</h3><p>กดส่งห้องตรวจจากรายชื่อผู้ป่วย</p></div>}</section></>;
}
