import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getDatabase } from "@/lib/db";
import { masterImageUrl, type ImageAsset } from "@/lib/master-images";
import { AddAdminForm } from "./add-admin-form";
import { AdminEditForm } from "./admin-edit-form";
export async function AdminManager() {
  const user = await requireAdmin();
  const result = await getDatabase().query<{ id: string; name: string; email: string; professional: Record<string, string> | null; image_asset: ImageAsset | null }>('SELECT u.id, u.name, u.email, u.image_asset, p.details AS professional FROM rom_auth_user u LEFT JOIN rom_admin_professional p ON p.user_id=u.id WHERE u.role=\'admin\' ORDER BY u."createdAt",u.id');
  return <section className="panel admin-management"><div className="panel-header"><div><h2><ShieldCheck size={19} />จัดการแอดมิน</h2><p>เพิ่ม แก้ไข ลบแอดมิน และจัดการข้อมูลใบประกอบวิชาชีพ</p></div></div><div className="admin-management-grid"><div><h3 className="admin-section-title">เพิ่มแอดมิน</h3><AddAdminForm /></div><div className="admin-list"><h3 className="admin-section-title">รายชื่อแอดมิน</h3><ul>{result.rows.map(admin => { const image = masterImageUrl(admin.image_asset); return <li key={`${admin.id}-${admin.name}-${admin.email}-${JSON.stringify(admin.professional)}-${image}`} data-admin-id={admin.id}><AdminEditForm id={admin.id} name={admin.name} email={admin.email} imageUrl={image} isSelf={admin.id === user.id} professional={admin.professional} /></li>; })}</ul></div></div></section>;
}
