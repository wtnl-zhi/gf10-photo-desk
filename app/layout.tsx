import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GF10 Photo Desk',
  description: '本地浏览 Panasonic Lumix GF10 Wi-Fi 照片。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
