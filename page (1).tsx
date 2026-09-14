"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

type News = { id: string; title: string; content: string; created_at: string; is_published: boolean }

export default function NewsPage() {
  const [newsList, setNewsList] = useState<News[]>([])
  useEffect(() => {
    supabase.from("news").select("*").eq("is_published", true).order("created_at", { ascending: false }).then(({ data }) => setNewsList(data ?? []))
  }, [])
  return (
    <div className="portal-bg min-h-screen text-white">
      <main className="relative z-10 max-w-5xl mx-auto px-5 py-14">
        <Link href="/" className="text-cyan-300 text-sm">← ホームへ戻る</Link>
        <div className="mt-6 mb-10"><p className="section-kicker">INFORMATION</p><h1 className="text-4xl md:text-5xl font-bold">最新情報</h1></div>
        <div className="space-y-4">
          {newsList.length ? newsList.map(item => (
            <article key={item.id} className="portal-panel">
              <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString("ja-JP")}</p>
              <h2 className="text-2xl font-bold mt-2">{item.title}</h2>
              <p className="text-gray-300 mt-4 whitespace-pre-wrap leading-relaxed">{item.content}</p>
            </article>
          )) : <div className="portal-panel text-gray-400">現在公開されているお知らせはありません。</div>}
        </div>
      </main>
    </div>
  )
}
