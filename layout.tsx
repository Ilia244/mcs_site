import type { Metadata } from "next"
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google"
import "./globals.css"
import Header from "@/components/Header"
import AuthProvider from "./providers/AuthProvider"

const pixelFont = Press_Start_2P({ weight:"400", subsets:["latin"], variable:"--font-pixel" })
const geistSans = Geist({ variable:"--font-geist-sans", subsets:["latin"] })
const geistMono = Geist_Mono({ variable:"--font-geist-mono", subsets:["latin"] })

export const metadata: Metadata = {
  title: "IRyiaServer | Minecraft Community Portal",
  description: "IRyiaServerのMinecraft参加型配信・イベント・最新情報をまとめたコミュニティポータル。",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ja"><body className={`${geistSans.variable} ${geistMono.variable} ${pixelFont.variable} antialiased`}><AuthProvider><Header />{children}</AuthProvider></body></html>
}
