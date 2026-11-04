"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  History,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  Monitor,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";
import { Brand } from "./brand";
import { authClient } from "@/lib/auth-client";
import { navigation } from "@/lib/navigation";

const icons = {
  dashboard: LayoutDashboard,
  registration: ClipboardList,
  queues: ListOrdered,
  history: History,
  display: Monitor,
  settings: Settings2,
};
export function AdminShell({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const current =
    navigation.find((item) => pathname.startsWith(item.href)) || navigation[0];
  async function logout() {
    setPending(true);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Logout failed");
      router.replace("/login");
      router.refresh();
    } catch {
      setError("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่");
      setPending(false);
    }
  }
  return (
    <div className="admin-app">
      {open && (
        <button
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
          aria-label="ปิดเมนู"
        />
      )}
      <aside
        className={`sidebar ${open ? "is-open" : ""}`}
        aria-label="เมนูหลัก"
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-only"
            onClick={() => setOpen(false)}
            aria-label="ปิดเมนู"
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="workspace-dot">R</span>
          <span>
            คลินิกของคุณ<small>พื้นที่ทำงานหลัก</small>
          </span>
          <ShieldCheck size={17} />
        </div>
        <p className="nav-caption">พื้นที่ทำงาน</p>
        <nav>
          {navigation.map((item) => {
            const Icon = icons[item.icon];
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
                {active && <span className="nav-active-dot" />}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span className="note-icon">
            <Activity size={19} />
          </span>
          <strong>ใส่ใจทุกการรอคอย</strong>
          <p>
            เริ่มต้นการดูแลที่ดี
            <br />
            ด้วยการจัดการที่เป็นระบบ
          </p>
          <Link href="/registration/new">
            ลงทะเบียนผู้ป่วย
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <span className="status-dot" />
          ROM Clinic<span className="version-label">v0.1</span>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-only"
              onClick={() => setOpen(true)}
              aria-label="เปิดเมนู"
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb-parent">พื้นที่ทำงาน</span>
            <ChevronRight size={14} />
            <strong>{current.label}</strong>
          </div>
          <div className="topbar-actions">
            <span className="admin-status">
              <ShieldCheck size={14} />
              Admin
            </span>
            <span className="topbar-divider" />
            <div className="user-avatar" aria-label={user.name}>
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="user-name">
              <strong>{user.name}</strong>
              <small>ผู้ดูแลระบบ</small>
            </div>
            <button
              className="icon-button logout-button"
              aria-label="ออกจากระบบ"
              title="ออกจากระบบ"
              disabled={pending}
              onClick={logout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        {error && (
          <p className="global-error" role="alert">
            {error}
          </p>
        )}
        <main className="page-content" id="main-content">
          {children}
        </main>
        <footer className="app-footer">
          <span>© 2026 ROM Clinic · ดูแลอย่างใส่ใจ</span>
          <span>
            <CalendarDays size={14} />
            ทุกวันของการดูแล เริ่มต้นที่นี่
          </span>
        </footer>
      </div>
    </div>
  );
}
