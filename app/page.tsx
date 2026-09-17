"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"
import { SITE_CONFIG } from "@/lib/site-config"
import LiveCarousel from "@/components/LiveCarousel"

type Post = {
  id: string
  title: string
  content: string
  created_at: string
  type: string
  tags?: {
    name: string
    color: string
    icon: string
  }[]
}

type Live = {
  id: string
  video_id: string
  title: string
  channel_name: string
  channel_role: string
  thumbnail_url: string | null
  viewer_count: number | null
  started_at: string | null
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [lives, setLives] = useState<Live[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: postData } = await supabase
        .from("posts")
        .select(
          "id,title,content,created_at,type,post_tags(tags(name,color,icon))"
        )
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(6)

      setPosts(
        (postData || []).map((item: any) => ({
          ...item,
          tags: (item.post_tags || []).map((tag: any) => tag.tags),
        }))
      )

      const { data: liveData } = await supabase
        .from("youtube_items")
        .select(
          "id,video_id,title,channel_name,channel_role,thumbnail_url,viewer_count,started_at"
        )
        .eq("kind", "live")
        .eq("is_live", true)
        .order("started_at", { ascending: false })

      setLives(liveData || [])
    }

    load()

    const timer = setInterval(load, 60000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="portal-bg min-h-screen text-white">
      {/* ======================================================
          HERO
      ====================================================== */}
      <section className="portal-hero relative overflow-hidden">
        <div className="portal-hero-overlay absolute inset-0 pointer-events-none" />

        {/* Decorative background elements */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/5 blur-3xl" />
          <div className="absolute left-[10%] top-[20%] h-32 w-32 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute right-[10%] bottom-[15%] h-40 w-40 rounded-full bg-purple-500/5 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[620px] max-w-6xl items-center justify-center px-5 py-24 text-center md:min-h-[700px] md:py-32">
          <div className="w-full max-w-4xl">
            {/* Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs tracking-[0.22em] text-gray-200 shadow-lg backdrop-blur-md">
                <span className="status-dot" />
                <span>OFFICIAL PORTAL</span>
              </div>
            </div>

            {/* Brand */}
            <div className="mt-10">
              <h1
                className="
                  portal-title
                  mx-auto
                  max-w-full
                  break-keep
                  text-[clamp(3rem,9vw,7rem)]
                  leading-[0.95]
                  tracking-tight
                "
              >
                Ilia./衣李亜
              </h1>

              <div className="mt-5">
                <p className="text-sm font-semibold tracking-[0.2em] text-cyan-300 sm:text-base md:text-lg">
                  OFFICIAL PORTAL
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="mx-auto mt-7 max-w-2xl px-2 text-base leading-8 text-gray-300 sm:text-lg md:text-xl">
              Ilia./衣李亜の活動情報と、MCSを中心とした
              <br className="hidden sm:block" />
              Minecraft・コミュニティ情報をまとめた公式ポータルです。
            </p>

            {/* Main actions */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/minecraft"
                className="portal-btn portal-btn-primary min-w-[150px]"
              >
                🎮 MCSを見る
              </Link>

              <Link
                href="/news"
                className="portal-btn portal-btn-dark min-w-[150px]"
              >
                📢 最新情報
              </Link>

              <a
                href={SITE_CONFIG.youtube}
                target="_blank"
                rel="noreferrer"
                className="portal-btn portal-btn-dark min-w-[150px]"
              >
                ▶ YouTube
              </a>

              <Link
                href="/help"
                className="portal-btn portal-btn-dark min-w-[150px]"
              >
                ❓ ヘルプ
              </Link>
            </div>

            {/* Quick navigation */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-gray-500 sm:text-sm">
              <Link
                href="/youtube"
                className="transition hover:text-cyan-300"
              >
                YouTube
              </Link>

              <span className="text-white/10">•</span>

              <Link
                href="/minecraft"
                className="transition hover:text-cyan-300"
              >
                MCS
              </Link>

              <span className="text-white/10">•</span>

              <Link
                href="/events"
                className="transition hover:text-cyan-300"
              >
                Events
              </Link>

              <span className="text-white/10">•</span>

              <Link
                href="/rules"
                className="transition hover:text-cyan-300"
              >
                Rules
              </Link>

              <span className="text-white/10">•</span>

              <Link
                href="/help"
                className="transition hover:text-cyan-300"
              >
                Help
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent"
        />
      </section>

      {/* ======================================================
          CONTENT
      ====================================================== */}
      <main className="relative z-10 mx-auto max-w-6xl space-y-16 px-5 py-14 md:py-16">
        {/* LIVE */}
        {lives.length > 0 && (
          <section>
            <LiveCarousel items={lives} />
          </section>
        )}

        {/* NEWS */}
        <section>
          <div className="section-heading">
            <div>
              <p className="section-kicker">INFORMATION</p>

              <h2>最新のお知らせ</h2>
            </div>

            <Link
              href="/news"
              className="text-sm text-cyan-300 transition hover:text-cyan-200"
            >
              一覧 →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {posts.length > 0 ? (
              posts.slice(0, 3).map((post) => (
                <Link
                  href={`/news/${post.id}`}
                  key={post.id}
                  className="portal-card block-hover"
                >
                  <div className="flex flex-wrap gap-2">
                    {post.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag.name}
                        className="tag-pill"
                        style={{
                          borderColor: tag.color,
                          color: tag.color,
                        }}
                      >
                        {tag.icon} {tag.name}
                      </span>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    {new Date(post.created_at).toLocaleDateString("ja-JP")}
                  </p>

                  <h3 className="mt-2 text-lg font-bold">
                    {post.title}
                  </h3>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-400">
                    {post.content}
                  </p>
                </Link>
              ))
            ) : (
              <div className="portal-card text-gray-400 md:col-span-3">
                現在公開されているお知らせはありません。
              </div>
            )}
          </div>
        </section>

        {/* MCS */}
        <section>
          <div className="section-heading">
            <div>
              <p className="section-kicker">MCS</p>

              <h2>Minecraft / MCS</h2>
            </div>

            <Link
              href="/minecraft"
              className="text-sm text-cyan-300 transition hover:text-cyan-200"
            >
              MCSを見る →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {SITE_CONFIG.servers.map((server) => (
              <Link
                key={server.id}
                href={`/join?server=${server.id}`}
                className="portal-card block-hover"
              >
                <div className="server-icon">⛏</div>

                <div className="mt-4 text-xs tracking-widest text-cyan-300">
                  {server.name}
                </div>

                <h3 className="mt-1 text-xl font-bold">
                  {server.label}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  {server.description}
                </p>

                <span className="mt-4 inline-block rounded border border-white/10 px-2 py-1 text-xs text-gray-300">
                  {server.edition}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* LINKS */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/youtube"
            className="portal-card portal-link-card"
          >
            <span>▶️</span>

            <div>
              <b>YouTube</b>
              <p>動画・配信・スタッフチャンネル</p>
            </div>
          </Link>

          <a
            href={SITE_CONFIG.discordOfficial}
            target="_blank"
            rel="noreferrer"
            className="portal-card portal-link-card"
          >
            <span>💬</span>

            <div>
              <b>Ilia./衣李亜 公式Discord</b>
              <p>公式コミュニティに参加</p>
            </div>
          </a>

          <a
            href={SITE_CONFIG.discordMcs}
            target="_blank"
            rel="noreferrer"
            className="portal-card portal-link-card"
          >
            <span>🎮</span>

            <div>
              <b>MCS公式Discord</b>
              <p>MCSの参加型・Minecraftコミュニティ</p>
            </div>
          </a>

          <Link
            href="/rules"
            className="portal-card portal-link-card"
          >
            <span>📜</span>

            <div>
              <b>参加ルール</b>
              <p>MCSを安心して楽しむためのルール</p>
            </div>
          </Link>
        </section>
      </main>

      {/* ======================================================
          FOOTER
      ====================================================== */}
      <footer className="border-t border-white/10 bg-black/40 px-5 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} MCS・Ilia./衣李亜
      </footer>
    </div>
  )
}