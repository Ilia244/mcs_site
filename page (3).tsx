import Link from "next/link"
import { SITE_CONFIG, STREAM_CONFIG } from "@/lib/site-config"

export default function YouTubePage() {
  return (
    <div className="portal-bg min-h-screen text-white">
      <main className="relative z-10 max-w-5xl mx-auto px-5 py-14">
        <Link href="/" className="text-cyan-300 text-sm">← ホームへ戻る</Link>
        <div className="mt-6 mb-10"><p className="section-kicker">YOUTUBE</p><h1 className="text-4xl md:text-5xl font-bold">YouTube配信</h1><p className="text-gray-400 mt-4">参加型配信やMinecraftの動画はこちら。</p></div>
        <section className={`live-card ${STREAM_CONFIG.live ? "live-card-active" : ""}`}>
          <div><p className="text-xs text-gray-400">{STREAM_CONFIG.live ? "🔴 LIVE NOW" : "CHANNEL"}</p><h2 className="text-2xl font-bold mt-1">{STREAM_CONFIG.live ? STREAM_CONFIG.title : "IRyiaのYouTubeチャンネル"}</h2></div>
          <a href={STREAM_CONFIG.youtubeUrl} target="_blank" rel="noreferrer" className="portal-btn portal-btn-primary">▶ YouTubeを見る</a>
        </section>
        <section className="portal-panel mt-5">
          <h2 className="text-2xl font-bold">参加型配信について</h2>
          <p className="text-gray-400 mt-3 leading-relaxed">配信中はトップページと参加ページに参加型の状態を表示します。参加条件や接続方法は「参加する」から確認してください。</p>
          <Link href="/join" className="portal-btn portal-btn-green mt-6 inline-flex">🎮 参加方法</Link>
        </section>
      </main>
    </div>
  )
}
