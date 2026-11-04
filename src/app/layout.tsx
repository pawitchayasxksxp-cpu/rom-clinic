import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Thai } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

// Every page verifies a database-backed session before showing private content.
export const instant = false;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const thaiFont = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ROM Clinic",
  description: "ระบบจัดการคิวและการให้บริการผู้ป่วยคลินิก",
  robots: { index: false, follow: false },
  icons: { icon: "/clinic-logo.jpg", apple: "/clinic-logo.jpg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} ${thaiFont.variable} h-full antialiased`}
    >
      <body>
        <a className="skip-link" href="#main-content">
          ข้ามไปยังเนื้อหา
        </a>
        <Suspense
          fallback={
            <div className="app-loading" role="status">
              กำลังเตรียมพื้นที่ทำงาน…
            </div>
          }
        >
          {children}
        </Suspense>
      </body>
    </html>
  );
}
