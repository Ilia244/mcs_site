"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/providers/AuthProvider"
import { getRoleLevel } from "@/lib/role"
type MinecraftCommand = {
  id: string
  category: string
  command: string
  aliases: string[]
  name: string
  description: string
  permission: string
  target: string
  notes: string
  sort_order: number
  enabled: boolean
  required_role: string
}

export default function MinecraftCommandsPage() {
  const router = useRouter()
  const { user, profile, accessToken, loading, profileLoading } = useAuth()
  const [commands, setCommands] = useState<MinecraftCommand[]>([])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState("")

  useEffect(() => {
    if (loading || profileLoading) return
    const role = profile?.role || (profile?.is_admin ? "admin" : "user")
    if (!user || getRoleLevel(role) < 10) {
      router.replace("/")
      return
    }
    if (!accessToken) return
    void (async () => {
      const response = await fetch("/api/minecraft/commands", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || "コマンド一覧を取得できませんでした")
        return
      }
      setCommands(data.commands || [])
    })()
  }, [loading, profileLoading, profile, user, accessToken, router])

  const categories = useMemo(() => ["all", ...Array.from(new Set(commands.map((x) => x.category)))], [commands])
  const filtered = useMemo(() => commands.filter((item) => {
    if (!item.enabled) return false
    if (category !== "all" && item.category !== category) return false
    const text = `${item.command} ${item.aliases.join(" ")} ${item.name} ${item.description} ${item.target}`.toLowerCase()
    return !query.trim() || text.includes(query.trim().toLowerCase())
  }), [commands, category, query])

  const copy = async (command: MinecraftCommand) => {
    await navigator.clipboard.writeText(command.command)
    setCopied(command.id)
    window.setTimeout(() => setCopied(""), 1400)
  }

  if (loading || profileLoading) return <div className="min-h-screen bg-slate-950 text-white p-10">Loading...</div>

  return (
    <div className="portal-bg min-h-screen text-white">
      <main className="max-w-6xl mx-auto px-5 py-12">
        <Link href="/minecraft" className="text-cyan-300 text-sm">← Minecraft / MCSへ戻る</Link>
        <div className="mt-7">
          <p className="section-kicker">MINECRAFT COMMANDS</p>
          <h1 className="text-4xl md:text-5xl font-bold">Minecraftコマンド一覧</h1>
          <p className="text-gray-400 mt-3 max-w-3xl">一般プレイヤー向けの便利コマンドから、モデレーター・スタッフ・管理者向けの運営コマンドまで、権限に応じて表示します。</p>
        </div>

        {error && <div className="portal-panel mt-7 border border-red-400/20 text-red-200">{error}</div>}

        <div className="portal-panel mt-7 p-4 md:p-5">
          <div className="flex flex-col md:flex-row gap-3">
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full p-3 rounded-xl bg-slate-800 border border-white/10 outline-none focus:border-cyan-400" placeholder="コマンド・名前・説明を検索" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-3 rounded-xl bg-slate-800 border border-white/10 outline-none">
              {categories.map((item) => <option key={item} value={item}>{item === "all" ? "すべてのカテゴリ" : item}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-7 space-y-8">
          {Array.from(new Set(filtered.map((x) => x.category))).map((cat) => (
            <section key={cat}>
              <h2 className="text-xl font-bold mb-3">▼ {cat}</h2>
              <div className="space-y-3">
                {filtered.filter((x) => x.category === cat).map((item) => (
                  <article key={item.id} className="portal-panel p-5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="text-cyan-200 bg-black/20 rounded-lg px-3 py-2 break-all">{item.command}</code>
                          <span className="text-xs text-gray-400 border border-white/10 rounded-full px-2 py-1">{item.target}</span>{item.aliases.length > 0 && <span className="text-xs text-cyan-300/80 border border-cyan-400/10 rounded-full px-2 py-1">別名: {item.aliases.join(" / ")}</span>}
                        </div>
                        <h3 className="font-bold text-lg mt-3">{item.name}</h3>
                        <p className="text-gray-400 mt-1 whitespace-pre-wrap">{item.description}</p>
                        <p className="text-xs text-purple-300 mt-2">利用対象: {item.required_role === "user" ? "一般ユーザー以上" : item.required_role === "owner" ? "オーナーのみ" : item.required_role === "admin" ? "管理者以上" : item.required_role === "staff" ? "スタッフ以上" : "モデレーター以上"}</p>
                        {item.permission && <p className="text-xs text-gray-500 mt-2">権限: <code>{item.permission}</code></p>}
                        {item.notes && <p className="text-sm text-amber-200/80 mt-2">注意: {item.notes}</p>}
                      </div>
                      <button onClick={() => void copy(item)} className="shrink-0 px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-400/20 hover:bg-cyan-500/25">{copied === item.id ? "コピーしました" : "📋 コピー"}</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
          {!filtered.length && <div className="portal-panel text-gray-400">該当するコマンドはありません。</div>}
        </div>
      </main>
    </div>
  )
}
