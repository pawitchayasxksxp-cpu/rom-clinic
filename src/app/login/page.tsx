import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  CalendarCheck2,
  Heart,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { getAdminSession } from "@/lib/session";

export const instant = false;
export const metadata = { title: "เข้าสู่ระบบ | ROM Clinic" };
export default async function LoginPage() {
  if (await getAdminSession()) redirect("/dashboard");
  return (
    <main className="login-page">
      <section className="login-story" aria-label="ROM Clinic">
        <Brand light />
        <div className="login-story-content">
          <span className="eyebrow light">
            <span className="status-dot" />
            CLINIC QUEUE MANAGEMENT
          </span>
          <h1>
            ทุกคิวที่เป็นระเบียบ
            <br />
            คือการดูแลที่<span>ดีกว่าเดิม</span>
          </h1>
          <p>
            ให้ทุกการรอคอยมีความหมาย
            <br />
            ดูแลผู้ป่วย จัดการคิว และเริ่มต้นวันทำงานได้อย่างราบรื่น
          </p>
          <div className="care-illustration" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="care-heart">
              <Heart fill="currentColor" size={65} strokeWidth={1.3} />
            </div>
            <span className="floating-tag tag-top">
              <CalendarCheck2 size={19} />
              คิวเป็นระบบ
              <ArrowUpRight size={15} />
            </span>
            <span className="floating-tag tag-bottom">
              <UsersRound size={19} />
              ใส่ใจทุกการรอคอย<span className="tiny-check">✓</span>
            </span>
            <span className="illustration-spark">
              <Sparkles size={26} />
            </span>
          </div>
        </div>
        <div className="login-story-footer">
          <span>ออกแบบเพื่อวันที่ดีขึ้นของคลินิก</span>
          <span>ROM CLINIC © 2026</span>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-mobile-brand">
          <Brand />
        </div>
        <div className="login-card">
          <span className="login-security-icon">
            <ShieldCheck size={25} />
          </span>
          <span className="eyebrow">ADMIN PORTAL</span>
          <h2>ยินดีต้อนรับกลับมา</h2>
          <p className="login-description">
            เข้าสู่ระบบเพื่อเริ่มดูแลคลินิกของคุณ
          </p>
          <LoginForm />
          <div className="login-help">
            <ShieldCheck size={16} />
            <span>พื้นที่ทำงานสำหรับบุคลากรของคลินิก</span>
          </div>
        </div>
        <p className="login-panel-footer">
          ROM Clinic Management System <span>·</span> ดูแลอย่างใส่ใจ
          ในทุกขั้นตอน
        </p>
      </section>
    </main>
  );
}
