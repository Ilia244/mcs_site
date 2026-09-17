"use client"

import Link from "next/link"
import { Suspense, useEffect, useState } from "react"

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
  const [servers, setServers] = useState<JoinServerConfig[]>(DEFAULT_JOIN_SERVERS)

  useEffect(() => {
    fetch("/api/join/servers")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.servers) && d.servers.length) setServers(d.servers)
      })
      .catch(() => {})
  }, [])

  const lobby =
    servers.find((item) => item.id.toLowerCase() === "lobby") ??
    servers.find((item) => item.name.toLowerCase() === "lobby") ??
    null

  const lobbyServers = servers.filter(
    (item) => item.joinMode === "lobby" && item.id !== lobby?.id,
  )

  const specialServers = servers.filter(
    (item) => item.joinMode === "special" && item.id !== lobby?.id,
  )

  const renderConnection = (item: JoinServerConfig) => (
    <div className="grid md:grid-cols-2 gap-4 mt-5">
      <div className="notice-box">
        <div className="flex items-center justify-between gap-3">
          <b>⚙️ Java版で参加</b>
          <CopyButton
            value={[item.javaAddress, item.javaPort].filter(Boolean).join(":")}
            label="接続情報をコピー"
          />
        </div>
        <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-3 space-y-2">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <span className="text-xs text-gray-500 block">サーバーアドレス</span>
              <code className="break-all">{item.javaAddress || "未設定"}</code>
            </div>
            <CopyButton value={item.javaAddress} label="アドレスをコピー" />
          </div>
          {item.javaPort && (
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div>
                <span className="text-xs text-gray-500 block">ポート</span>
                <code>{item.javaPort}</code>
              </div>
              <CopyButton value={item.javaPort} label="ポートをコピー" />
            </div>
          )}
        </div>
        <div className="mt-3 flex justify-end">
          <Link
            href="/help#java"
            className="text-xs text-cyan-300/80 hover:text-cyan-200 hover:underline"
          >
            ヘルプ？ →
          </Link>
        </div>
      </div>

      <div className="notice-box">
        <div className="flex items-center justify-between gap-3">
          <b>🟩 Bedrock版で参加</b>
          <CopyButton
            value={[item.bedrockAddress, item.bedrockPort].filter(Boolean).join(":")}
            label="接続情報をコピー"
          />
        </div>
        <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-3 space-y-2">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <span className="text-xs text-gray-500 block">サーバーアドレス</span>
              <code className="break-all">{item.bedrockAddress || "未設定"}</code>
            </div>
            <CopyButton value={item.bedrockAddress} label="アドレスをコピー" />
          </div>
          {item.bedrockPort && (
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div>
                <span className="text-xs text-gray-500 block">ポート</span>
                <code>{item.bedrockPort}</code>
              </div>
              <CopyButton value={item.bedrockPort} label="ポートをコピー" />
            </div>
          )}
        </div>
        {item.bedrockFriendJoin && (
          <p className="text-cyan-300 text-sm mt-3">
            👥 フレンド参加：Minecraftの「フレンド」一覧から{" "}
            <b>{item.bedrockFriendName || "MCS"}</b> を選んで参加できます。
          </p>
        )}
        <div className="mt-3 flex justify-end">
          <Link
            href="/help#bedrock"
            className="text-xs text-cyan-300/80 hover:text-cyan-200 hover:underline"
          >
            ヘルプ？ →
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="portal-bg min-h-screen text-white">
      <main className="relative z-10 max-w-5xl mx-auto px-5 py-14">
        <Link href="/" className="text-cyan-300 text-sm">
          ← ホームへ戻る
        </Link>

        <div className="mt-6 mb-10">
          <p className="section-kicker">MCS / JOIN</p>
          <h1 className="text-4xl md:text-5xl font-bold">Minecraft参加方法</h1>
          <p className="text-gray-400 mt-4">
            MCSでは、通常のサーバーはまずロビーへ参加し、ロビー内から各サーバーへ移動します。
          </p>
        </div>

        {STREAM_CONFIG.live && STREAM_CONFIG.participationEnabled && (
          <div className="live-card live-card-active mb-8">
            <div>
              <p className="text-xs text-red-400 font-bold tracking-widest">
                🔴 PARTICIPATION OPEN
              </p>
              <h2 className="text-xl font-bold mt-1">{STREAM_CONFIG.title}</h2>
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
          <h2 className="text-2xl font-bold mt-1">MCSロビーへ参加</h2>
          <p className="text-gray-400 mt-3">
            サバイバルやクリエイティブなどの通常サーバーを利用する場合、個別のサーバーを選ぶ必要はありません。
            まずMCSロビーへ参加し、ロビーから遊びたいサーバーを選択してください。
          </p>

          {lobby ? (
            <>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="info-box">
                  <span>入口</span>
                  <strong>MCSロビー</strong>
                  <p className="text-gray-500 text-sm mt-1">
                    {lobby.description || "通常サーバーへ移動するための共通ロビーです。"}
                  </p>
                </div>
                <div className="info-box">
                  <span>ロビーから参加できるサーバー</span>
                  {lobbyServers.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {lobbyServers.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-white/10 bg-black/10 px-3 py-2"
                        >
                          <div className="font-bold">{item.label || item.name}</div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.description || "ロビーから参加できる通常サーバーです。"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm mt-2">
                      現在、ロビーから参加できるサーバーは登録されていません。
                    </p>
                  )}
                </div>
              </div>
              {renderConnection(lobby)}

            </>
          ) : (
            <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-amber-200">
              MCSロビーの接続情報がまだ設定されていません。管理者は「管理画面 → 参加方法」から
              内部ID <code>lobby</code> のサーバーを登録してください。
            </div>
          )}
        </section>

        {specialServers.length > 0 && (
          <section className="portal-panel mt-5">
            <p className="section-kicker">SPECIAL</p>
            <h2 className="text-2xl font-bold mt-1">特設サーバー</h2>
            <p className="text-gray-400 mt-3">
              特設サーバーなど、ロビーを経由しないサーバーだけこちらに表示されます。
            </p>

            <div className="space-y-6 mt-6">
              {specialServers.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-fuchsia-300 font-bold tracking-widest">
                        SPECIAL SERVER
                      </p>
                      <h3 className="text-xl font-bold mt-1">{item.label}</h3>
                      <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                    </div>
                    <span className="text-xs rounded-full border border-fuchsia-400/20 px-3 py-1 text-fuchsia-200">
                      ロビーを経由せず直接参加
                    </span>
                  </div>
                  {renderConnection(item)}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="portal-panel mt-5">
          <p className="section-kicker">STEP 02</p>
          <h2 className="text-2xl font-bold mt-1">ロビーから遊びたいサーバーへ移動</h2>
          <ul className="mt-5 space-y-3 text-gray-300">
            <li>① 上の「MCSロビー」に参加します。</li>
            <li>② ロビー内にあるサーバー選択から遊びたいモードを選びます。</li>
            <li>③ サバイバル・クリエイティブなどへ移動して遊びます。</li>
          </ul>
          <p className="text-gray-500 text-sm mt-4">
            ※ ロビー経由のサーバーは、この参加方法ページで個別に接続する必要はありません。
          </p>
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
          <Link href="/rules" className="inline-block mt-6 text-cyan-300 hover:underline">
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