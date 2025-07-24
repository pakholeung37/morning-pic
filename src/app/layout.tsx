import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "每日晨图 - Morning Pic",
  description: "基于 AI 的每日晨图生成器，使用 Google Gemini AI 为您每天生成独特的晨图",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml', sizes: '32x32' }
    ],
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
