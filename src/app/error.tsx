"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <span className="eyebrow">ROM CLINIC</span>
      <h1>ไม่สามารถเปิดหน้านี้ได้ชั่วคราว</h1>
      <p>กรุณาลองอีกครั้ง หรือติดต่อผู้ดูแลระบบ</p>
      <button className="button button-primary" onClick={reset}>
        ลองอีกครั้ง
      </button>
    </main>
  );
}
