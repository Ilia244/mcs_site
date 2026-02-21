import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IRyia Portal",
  description: "YouTube × Minecraft Community Site",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        {/* ナビゲーションバー */}
        <nav className="flex justify-between items-center px-8 py-4 bg-gradient-to-r from-purple-900 to-cyan-900 shadow-lg">

          <h1 className="text-xl font-bold text-cyan-400 drop-shadow-[0_0_10px_#00ffff]">
            IRyia Portal
          </h1>

          <div className="flex gap-6 items-center">
            <Link href="/" className="hover:text-cyan-400 transition">
              ホーム
            </Link>
            <Link href="/news" className="hover:text-cyan-400 transition">
              最新情報
            </Link>
            <Link href="/minecraft" className="hover:text-cyan-400 transition">
              マイクラ参加型
            </Link>
            <Link href="/rules" className="hover:text-cyan-400 transition">
              ルール
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-cyan-500 rounded-xl hover:scale-110 transition shadow-[0_0_10px_#00ffff]"
            >
              ログイン
            </Link>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}