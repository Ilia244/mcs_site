"use client"

import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import { SITE_CONFIG, STREAM_CONFIG, DEFAULT_JOIN_SERVERS, type JoinServerConfig } from "@/lib/site-config"

function CopyButton({ value, label = "コピー" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      // Clipboard APIが使えない環境でも何も壊さない
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!value}
      className="shrink-0 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-400/10 disabled:opacity-40"
    >
      {copied ? "✓ コピーしました" : label}
    </button>
  )
}

function JoinContent() {
  const params = useSearchParams()

  const [servers, setServers] = useState<JoinServerConfig[]>(DEFAULT_JOIN_SERVERS)

  useEffect(() => { fetch("/api/join/servers").then(r => r.ok ? r.json() : null).then(d => { if (Array.isArray(d?.servers) && d.servers.length) setServers(d.servers) }).catch(() => {}) }, [])

  // 通常はMCSロビーへ参加し、そこから各サーバーへ移動します。
  // 個別接続を案内するのは、管理画面で「特設サーバー」に設定したものだけです。
  const lobbyServer = servers.find((item) => item.joinMode === "lobby") ?? servers[0]
  const specialServers = servers.filter((item) => item.joinMode === "special")
  const requested = params.get("server")
  const requestedServer = requested ? servers.find((item) => item.id === requested) : undefined
  const server = requestedServer?.joinMode === "special" ? requestedServer : lobbyServer

  return (
    <div className="portal-bg min-h-screen text-white">
      <main className="relative z-10 max-w-5xl mx-auto px-5 py-14">
        <Link href="/" className="text-cyan-300 text-sm">
          ← ホームへ戻る
        </Link>

        <div className="mt-6 mb-10">
          <p className="section-kicker">MCS / JOIN</p>

          <h1 className="text-4xl md:text-5xl font-bold">
            Minecraft参加方法
          </h1>

          <p className="text-gray-400 mt-4">
            配信を見ながら、このページの手順で参加できます。
          </p>
        </div>

        {STREAM_CONFIG.live && STREAM_CONFIG.participationEnabled && (
          <div className="live-card live-card-active mb-8">
            <div>
              <p className="text-xs text-red-400 font-bold tracking-widest">
                🔴 PARTICIPATION OPEN
              </p>

              <h2 className="text-xl font-bold mt-1">
                {STREAM_CONFIG.title}
              </h2>
            </div>

            <a
              href={STREAM_CONFIG.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="portal-btn portal-btn-primary"
            >
              配信を見る
            </a>
          </div>
        )}

        <section className="portal-panel">
          <p className="section-kicker">STEP 01</p>

          <h2 className="text-2xl font-bold mt-1">
            MCSロビーに参加
          </h2>

          <p className="text-gray-300 mt-4 leading-7">
            通常のMCSサーバーは、まずロビーへ参加してください。ロビーから目的のサーバーへ移動できます。
          </p>

          {lobbyServer ? (
            <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
              <span className="text-xs text-cyan-300">{lobbyServer.name}</span>
              <b className="block mt-1 text-xl">{lobbyServer.label}</b>
              <p className="text-gray-400 text-sm mt-2">{lobbyServer.description}</p>
              <div className="mt-4">
                <span className="inline-flex rounded-lg border border-white/10 bg-black/10 px-3 py-1.5 text-xs text-gray-300">
                  {lobbyServer.edition}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-5 text-gray-400">
              現在、ロビーの接続情報が設定されていません。
            </div>
          )}

          {specialServers.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-sm font-bold text-amber-200">⚠️ 特設サーバー</p>
              <p className="text-gray-500 text-sm mt-1">イベントなど、個別の接続先が案内されているサーバーはこちらです。</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {specialServers.map((item) => (
                  <Link
                    key={item.id}
                    href={`/join?server=${item.id}`}
                    className={`join-server ${item.id === server?.id ? "join-server-selected" : ""}`}
                  >
                    <span className="text-xs text-amber-300">{item.name}</span>
                    <b className="block mt-1">{item.label}</b>
                    <small className="text-gray-500">{item.edition}</small>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="portal-panel mt-5">
          <p className="section-kicker">STEP 02</p>

          <h2 className="text-2xl font-bold mt-1">
            {server?.joinMode === "special" ? "特設サーバーの接続情報" : "ロビーの接続情報"}
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="info-box">
              <span>参加先</span><strong>{server?.label ?? "MCSロビー"}</strong>
              <p className="text-gray-500 text-sm mt-1">{server?.description ?? "MCSの入口となるロビーです。ここから各サーバーへ移動できます。"}</p>
            </div>
            <div className="info-box">
              <span>対応エディション</span><strong>{server?.edition ?? "Java / Bedrock"}</strong>
              <p className="text-gray-500 text-sm mt-1">Java版・Bedrock版それぞれの参加方法を下に案内しています。</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <div className="notice-box">
              <div className="flex items-center justify-between gap-3">
                <b>⚙️ Java版で参加</b>
                <CopyButton value={[server?.javaAddress, server?.javaPort].filter(Boolean).join(":")} label="接続情報をコピー" />
              </div>
              <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-3 space-y-2">
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0"><span className="text-xs text-gray-500 block">サーバーアドレス</span><code className="break-all">{server?.javaAddress || "未設定"}</code></div>
                  <CopyButton value={server?.javaAddress ?? ""} label="アドレスをコピー" />
                </div>
                {server?.javaPort && <div className="flex items-center justify-between gap-3 min-w-0">
                  <div><span className="text-xs text-gray-500 block">ポート</span><code>{server?.javaPort}</code></div>
                  <CopyButton value={server?.javaPort ?? ""} label="ポートをコピー" />
                </div>}
              </div>
              <div className="mt-3 flex justify-end">
                <Link href="/help#java" className="text-xs text-cyan-300/80 hover:text-cyan-200 hover:underline">ヘルプ？ →</Link>
              </div>
            </div>

            <div className="notice-box">
              <div className="flex items-center justify-between gap-3">
                <b>🟩 Bedrock版で参加</b>
                <CopyButton value={[server?.bedrockAddress, server?.bedrockPort].filter(Boolean).join(":")} label="接続情報をコピー" />
              </div>
              <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-3 space-y-2">
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0"><span className="text-xs text-gray-500 block">サーバーアドレス</span><code className="break-all">{server?.bedrockAddress || "未設定"}</code></div>
                  <CopyButton value={server?.bedrockAddress ?? ""} label="アドレスをコピー" />
                </div>
                {server?.bedrockPort && <div className="flex items-center justify-between gap-3 min-w-0">
                  <div><span className="text-xs text-gray-500 block">ポート</span><code>{server?.bedrockPort}</code></div>
                  <CopyButton value={server?.bedrockPort ?? ""} label="ポートをコピー" />
                </div>}
              </div>
              {server?.bedrockFriendJoin && <p className="text-cyan-300 text-sm mt-3">👥 フレンド参加：Minecraftの「フレンド」一覧から <b>{server?.bedrockFriendName || "MCS"}</b> を選んで参加できます。</p>}
              <div className="mt-3 flex justify-end">
                <Link href="/help#bedrock" className="text-xs text-cyan-300/80 hover:text-cyan-200 hover:underline">ヘルプ？ →</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="portal-panel mt-5">
          <p className="section-kicker">STEP 03</p>

          <h2 className="text-2xl font-bold mt-1">
            参加ルールを確認
          </h2>

          <ul className="mt-5 space-y-3 text-gray-300">
            <li>✓ 他の参加者が楽しめるように行動する</li>
            <li>✓ 暴言・荒らし・故意の妨害をしない</li>
            <li>✓ 配信主・運営スタッフの指示に従う</li>
            <li>✓ バグや不具合の悪用をしない</li>
          </ul>

          <Link
            href="/rules"
            className="inline-block mt-6 text-cyan-300 hover:underline"
          >
            すべてのルールを読む →
          </Link>
        </section>
      </main>
    </div>
  )
}

function JoinLoading() {
  return (
    <div className="portal-bg min-h-screen text-white">
      <main className="relative z-10 max-w-5xl mx-auto px-5 py-14">
        <div className="portal-panel">
          <p className="text-gray-400">
            参加ページを読み込んでいます...
          </p>
        </div>
      </main>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={<JoinLoading />}>
      <JoinContent />
    </Suspense>
  )
}