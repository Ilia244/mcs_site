"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { SITE_CONFIG, STREAM_CONFIG } from "@/lib/site-config"

function JoinContent() {
  const params = useSearchParams()
  const selected = params.get("server") ?? "survival"
  const server = SITE_CONFIG.servers.find((item) => item.id === selected) ?? SITE_CONFIG.servers[0]

  return (
    <div className="portal-bg min-h-screen text-white">
      <main className="relative z-10 max-w-5xl mx-auto px-5 py-14">
        <Link href="/" className="text-cyan-300 text-sm">← ホームへ戻る</Link>
        <div className="mt-6 mb-10">
          <p className="section-kicker">JOIN IRYIASERVER</p>
          <h1 className="text-4xl md:text-5xl font-bold">Minecraft参加方法</h1>
          <p className="text-gray-400 mt-4">配信を見ながら、このページの手順で参加できます。</p>
        </div>

        {STREAM_CONFIG.live && STREAM_CONFIG.participationEnabled && (
          <div className="live-card live-card-active mb-8">
            <div>
              <p className="text-xs text-red-400 font-bold tracking-widest">🔴 PARTICIPATION OPEN</p>
              <h2 className="text-xl font-bold mt-1">{STREAM_CONFIG.title}</h2>
            </div>
            <a href={STREAM_CONFIG.youtubeUrl} target="_blank" rel="noreferrer" className="portal-btn portal-btn-primary">配信を見る</a>
          </div>
        )}

        <section className="portal-panel">
          <p className="section-kicker">STEP 01</p>
          <h2 className="text-2xl font-bold mt-1">参加するサーバーを選択</h2>
          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            {SITE_CONFIG.servers.map((item) => (
              <Link key={item.id} href={`/join?server=${item.id}`} className={`join-server ${item.id === server.id ? "join-server-selected" : ""}`}>
                <span className="text-xs text-cyan-300">{item.name}</span>
                <b className="block mt-1">{item.label}</b>
                <small className="text-gray-500">{item.edition}</small>
              </Link>
            ))}
          </div>
        </section>

        <section className="portal-panel mt-5">
          <p className="section-kicker">STEP 02</p>
          <h2 className="text-2xl font-bold mt-1">接続情報</h2>
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="info-box">
              <span>サーバー</span>
              <strong>{server.label}</strong>
              <p className="text-gray-500 text-sm mt-1">接続先は配信・運営から案内されたものを使用してください。</p>
            </div>
            <div className="info-box">
              <span>対応エディション</span>
              <strong>{server.edition}</strong>
              <p className="text-gray-500 text-sm mt-1">Bedrock版はGeyser経由での参加を想定しています。</p>
            </div>
          </div>
          <div className="notice-box mt-5">
            ⚙️ <b>サーバーアドレス・ポート</b>
            <p className="text-gray-400 text-sm mt-1">公開接続情報は運用開始時にここへ設定します。現在は誤接続防止のため固定値を表示していません。</p>
          </div>
        </section>

        <section className="portal-panel mt-5">
          <p className="section-kicker">STEP 03</p>
          <h2 className="text-2xl font-bold mt-1">参加ルールを確認</h2>
          <ul className="mt-5 space-y-3 text-gray-300">
            <li>✓ 他の参加者が楽しめるように行動する</li>
            <li>✓ 暴言・荒らし・故意の妨害をしない</li>
            <li>✓ 配信主・運営スタッフの指示に従う</li>
            <li>✓ バグや不具合の悪用をしない</li>
          </ul>
          <Link href="/rules" className="inline-block mt-6 text-cyan-300 hover:underline">すべてのルールを読む →</Link>
        </section>
      </main>
    </div>
  )
}

export default function JoinPage() {
  return <JoinContent />
}
