"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { SITE_CONFIG, STREAM_CONFIG } from "@/lib/site-config"

type StreamState = { live:boolean; title:string; description:string; youtubeUrl:string; participationEnabled:boolean }

type News = {
  id: string
  title: string
  content: string
  created_at: string
  is_published: boolean
}

export default function Home() {
  const [news, setNews] = useState<News[]>([])
  const [stream, setStream] = useState<StreamState>({ live: STREAM_CONFIG.live, title: STREAM_CONFIG.title, description: STREAM_CONFIG.description, youtubeUrl: STREAM_CONFIG.youtubeUrl, participationEnabled: STREAM_CONFIG.participationEnabled })

  useEffect(() => {
    const load = async () => {
      const { data: settings } = await supabase.from("site_settings").select("key,value").in("key", [
        "stream_live", "stream_title", "stream_description", "stream_youtube_url", "stream_participation_enabled"
      ])
      if (settings?.length) {
        const map = Object.fromEntries(settings.map(row => [row.key, row.value]))
        setStream({
          live: map.stream_live === "true",
          title: map.stream_title || STREAM_CONFIG.title,
          description: map.stream_description || STREAM_CONFIG.description,
          youtubeUrl: map.stream_youtube_url || STREAM_CONFIG.youtubeUrl,
          participationEnabled: map.stream_participation_enabled !== "false",
        })
      }
      const { data } = await supabase
        .from("news")
        .select("id,title,content,created_at,is_published")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(3)

      setNews(data ?? [])
    }
    load()
  }, [])

  return (
    <div className="portal-bg text-white">
      <section className="portal-hero">
        <div className="portal-hero-overlay" />
        <div className="relative z-10 max-w-6xl mx-auto px-5 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-black/40 backdrop-blur text-xs tracking-widest">
              <span className={`status-dot ${stream.live ? "is-live" : ""}`} />
              {stream.live ? "LIVE / 参加型配信中" : "IRyiaServer COMMUNITY"}
            </div>

            <h1 className="portal-title mt-6">
              {SITE_CONFIG.name}
            </h1>
            <p className="text-cyan-300 font-semibold tracking-[0.2em] uppercase">
              {SITE_CONFIG.subtitle}
            </p>
            <p className="mt-5 text-gray-200 text-lg md:text-xl max-w-2xl leading-relaxed">
              Minecraftを中心に、みんなで遊べる参加型配信・イベント・コミュニティ情報をまとめています。
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/join" className="portal-btn portal-btn-primary">
                🎮 参加する
              </Link>
              <Link href="/news" className="portal-btn portal-btn-dark">
                📢 最新情報
              </Link>
              <a href={SITE_CONFIG.youtube} target="_blank" rel="noreferrer" className="portal-btn portal-btn-dark">
                ▶ YouTube
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="relative z-10 max-w-6xl mx-auto px-5 py-12 space-y-14">
        <section className={`live-card ${stream.live ? "live-card-active" : ""}`}>
          <div>
            <div className="text-xs font-bold tracking-[0.2em] text-gray-400">
              {stream.live ? "🔴 LIVE NOW" : "NEXT PARTICIPATION STREAM"}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mt-2">{stream.live ? stream.title : "参加型配信のお知らせ"}</h2>
            <p className="text-gray-300 mt-2">
              {stream.live ? stream.description : STREAM_CONFIG.nextStream}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            {stream.live && (
              <a href={stream.youtubeUrl} target="_blank" rel="noreferrer" className="portal-btn portal-btn-primary">
                📺 配信を見る
              </a>
            )}
            <Link href="/join" className="portal-btn portal-btn-green">
              🎮 参加方法
            </Link>
          </div>
        </section>

        <section>
          <div className="section-heading">
            <div>
              <p className="section-kicker">SERVER HUB</p>
              <h2>サーバーへ参加</h2>
            </div>
            <Link href="/join" className="text-cyan-300 hover:text-cyan-200 text-sm">詳しく見る →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {SITE_CONFIG.servers.map((server) => (
              <Link key={server.id} href={`/join?server=${server.id}`} className="portal-card block-hover">
                <div className="server-icon">⛏</div>
                <div>
                  <div className="text-xs text-cyan-300 tracking-widest">{server.name}</div>
                  <h3 className="text-xl font-bold mt-1">{server.label}</h3>
                  <p className="text-gray-400 text-sm mt-2">{server.description}</p>
                  <span className="inline-block mt-4 text-xs border border-white/10 rounded px-2 py-1 text-gray-300">{server.edition}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="section-heading">
            <div>
              <p className="section-kicker">INFORMATION</p>
              <h2>最新情報</h2>
            </div>
            <Link href="/news" className="text-cyan-300 hover:text-cyan-200 text-sm">一覧 →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {news.length > 0 ? news.map((item) => (
              <article key={item.id} className="portal-card">
                <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString("ja-JP")}</p>
                <h3 className="font-bold text-lg mt-2">{item.title}</h3>
                <p className="text-gray-400 text-sm mt-3 line-clamp-3">{item.content}</p>
              </article>
            )) : (
              <div className="portal-card md:col-span-3 text-gray-400">
                現在公開されているお知らせはありません。
              </div>
            )}
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          <Link href="/rules" className="portal-card portal-link-card"><span>📜</span><div><b>参加ルール</b><p>安心して遊ぶためのルール</p></div></Link>
          <a href={SITE_CONFIG.dynmap || "#"} target={SITE_CONFIG.dynmap ? "_blank" : undefined} rel="noreferrer" className={`portal-card portal-link-card ${!SITE_CONFIG.dynmap ? "opacity-60" : ""}`}><span>🗺️</span><div><b>Dynmap</b><p>{SITE_CONFIG.dynmap ? "ワールドマップを見る" : "準備中"}</p></div></a>
          <a href={SITE_CONFIG.discord} target="_blank" rel="noreferrer" className="portal-card portal-link-card"><span>💬</span><div><b>Discord</b><p>コミュニティに参加</p></div></a>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/40 px-5 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} {SITE_CONFIG.name} / IRyia
      </footer>
    </div>
  )
}
