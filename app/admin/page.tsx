"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { hasPermission, ROLE_LEVEL } from "@/lib/role"
const REQUIRED_LEVEL = 80 // admin以上

type Profile = {
  id: string
  displayName: string
  role: string
  created_at: string
}

type News = {
  id: string
  title: string
  content: string
  created_at: string
  is_published: boolean
}

export default function AdminPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<Profile[]>([])
  const [myRole, setMyRole] = useState<string>("user")
  const [myId, setMyId] = useState<string>("")

  const [page, setPage] = useState(1)
  const pageSize = 10
  const [totalCount, setTotalCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "news" | "stats" | "logs">("dashboard")
  const [sortKey, setSortKey] = useState<"displayName" | "role" | "created_at">("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const [newsList, setNewsList] = useState<News[]>([])
  const [newsTitle, setNewsTitle] = useState("")
  const [newsContent, setNewsContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [publishedCount, setPublishedCount] = useState(0)
  const getLevel = (role: string) => ROLE_LEVEL[role as keyof typeof ROLE_LEVEL] ?? 0

  /* =========================
     初期認証チェック
  ========================== */
  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.replace("/account/login")
        return
      }

      setMyId(userData.user.id)

      const { data: me } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single()

      if (!me || !hasPermission(me.role, REQUIRED_LEVEL)) {
        router.replace("/")
        return
      }

      setMyRole(me.role)

      await fetchUsers()
      await fetchNews()
      await fetchPublishedCount()

      setLoading(false)
    }

    init()
  }, [])

  /* =========================
     ユーザー取得
  ========================== */
  const fetchUsers = async () => {
    const { data } = await supabase.rpc(
      "admin_get_profiles_paginated",
      {
        page_number: page,
        page_size: pageSize,
        sort_column: sortKey,
        sort_direction: sortOrder,
      }
    )

    setUsers(data || [])

    const { data: count } =
      await supabase.rpc("admin_get_profiles_count")

    setTotalCount(count || 0)
  }

  useEffect(() => {
    if (!loading) fetchUsers()
  }, [page, sortKey, sortOrder])

  /* =========================
     ニュース取得
  ========================== */
  const fetchNews = async () => {
    const { data } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false })

    setNewsList(data ?? [])
  }

  const fetchPublishedCount = async () => {
    const { count } = await supabase
      .from("news")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)

    setPublishedCount(count || 0)
  }

  useEffect(() => {
    if (activeTab === "news") fetchNews()
  }, [activeTab])

  /* =========================
     ニュース保存
  ========================== */
  const saveNews = async () => {
    if (!newsTitle || !newsContent) return

    let error

    if (editingId) {
      const res = await supabase.rpc("admin_update_news", {
        news_id: editingId,
        news_title: newsTitle,
        news_content: newsContent,
      })
      error = res.error
    } else {
      const res = await supabase.rpc("admin_create_news", {
        news_title: newsTitle,
        news_content: newsContent,
      })
      error = res.error
    }

    if (error) return console.error(error)

    setNewsTitle("")
    setNewsContent("")
    setEditingId(null)
    fetchNews()
  }

  /* =========================
     公開切替
  ========================== */
  const togglePublish = async (id: string, current: boolean) => {
    const { error } = await supabase.rpc(
      "admin_toggle_news_publish",
      {
        news_id: id,
        new_state: !current,
      }
    )

    if (error) {
      console.error(error)
      return
    }

    fetchNews()
    fetchPublishedCount()
  }

  /* =========================
     削除
  ========================== */
  const deleteNews = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return
    const { error } = await supabase.rpc(
      "admin_delete_news",
      { news_id: id }
    )

    if (error) {
      console.error(error)
      return
    }

    fetchNews()
    fetchPublishedCount()
  }

  /* =========================
     権限変更（階層制御）
  ========================== */
  const toggleRole = async (
    targetId: string,
    targetRole: string
  ) => {
    const myLevel = getLevel(myRole)
    const targetLevel = getLevel(targetRole)

    if (targetId === myId) {
      alert("自分の権限は変更できません")
      return
    }

    if (targetLevel >= myLevel) {
      alert("自分より上位のユーザーは変更できません")
      return
    }

    const allowedRoles = Object.entries(ROLE_LEVEL)
      .filter(([_, level]) => level < myLevel)
      .map(([role]) => role)

    const newRole = prompt(
      `変更先ロールを入力:\n${allowedRoles.join(", ")}`,
      targetRole
    )

    if (!newRole || !allowedRoles.includes(newRole)) {
      alert("無効なロールです")
      return
    }

    await supabase.rpc("admin_update_role", {
      target_id: targetId,
      new_role: newRole,
    })

    fetchUsers()
  }

  if (loading)
    return <div className="p-10 text-white">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-row">

      {/* ===== モバイル用オーバーレイ ===== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== サイドバー ===== */}
      <aside
        className={`
          fixed lg:relative
          top-0 left-0
          h-full lg:h-auto
          w-64
          bg-slate-950 p-6
          border-r border-slate-800
          transform transition-transform duration-300
          z-40
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          flex flex-col
        `}
      >
        <h2 className="text-2xl font-bold mb-10">
          Admin
        </h2>

        <nav className="flex flex-col gap-2">
          {["dashboard", "users", "news", "stats", "logs"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as any)
                setSidebarOpen(false)
              }}
              className={`text-left px-4 py-2 rounded-lg transition ${
                activeTab === tab
                  ? "bg-slate-800"
                  : "hover:bg-slate-900"
              }`}
            >
              {tab === "dashboard" && "ダッシュボード"}
              {tab === "users" && "ユーザー管理"}
              {tab === "news" && "最新情報管理"}
              {tab === "stats" && "統計"}
              {tab === "logs" && "ログ"}
            </button>
          ))}
        </nav>

        <div className="mt-auto text-xs text-gray-600">
          Admin Panel v2
        </div>
      </aside>

      {/* ===== メインエリア ===== */}
      <main className="flex-1 p-4 md:p-8">

        {/* モバイル用メニューボタン */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden mb-6 px-4 py-2 bg-slate-700 rounded"
        >
          ☰ メニュー
        </button>

        <div className="max-w-6xl mx-auto">

          {/* ===== ダッシュボード ===== */}
          {activeTab === "dashboard" && (
            <div className="bg-slate-800 p-4 md:p-8 rounded-2xl shadow">
              <h1 className="text-2xl font-bold mb-6">
                ダッシュボード
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                <div className="bg-slate-700 p-6 rounded-xl">
                  <p className="text-sm text-gray-400">総ユーザー数</p>
                  <p className="text-3xl font-bold">{totalCount}</p>
                </div>

                <div className="bg-slate-700 p-6 rounded-xl">
                  <p className="text-sm text-gray-400">登録ニュース数</p>
                  <p className="text-3xl font-bold">{newsList.length}</p>
                </div>

                <div className="bg-slate-700 p-6 rounded-xl">
                  <p className="text-sm text-gray-400">公開中ニュース数</p>
                  <p className="text-3xl font-bold text-green-400">{publishedCount}</p>
                </div>

              </div>
            </div>
          )}


          {/* ===== ユーザー管理 ===== */}
          {activeTab === "users" && (
            <div className="bg-slate-800 p-4 md:p-8 rounded-2xl shadow">

              <h1 className="text-2xl font-bold mb-6">
                ユーザー管理
              </h1>

              {/* 操作バー */}
              <div className="flex gap-4 mb-6">
                <select
                  value={sortKey}
                  onChange={(e) =>
                    setSortKey(
                      e.target.value as
                        | "displayName"
                        | "role"
                        | "created_at"
                    )
                  }
                  className="px-4 py-2 rounded bg-slate-700"
                >
                  <option value="created_at">作成日</option>
                  <option value="displayName">名前</option>
                  <option value="role">role</option>
                </select>

                <button
                  onClick={() =>
                    setSortOrder(
                      sortOrder === "asc"
                        ? "desc"
                        : "asc"
                    )
                  }
                  className="px-4 py-2 bg-slate-700 rounded"
                >
                  {sortOrder === "asc"
                    ? "昇順"
                    : "降順"}
                </button>
              </div>

              {/* ユーザー一覧 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {users.map((user) => {
                  const disabled =
                    user.id === myId ||
                    getLevel(user.role) >= getLevel(myRole)

                  return (
                    <div
                      key={user.id}
                      className="bg-slate-700 p-6 rounded-xl flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold">
                          {user.displayName || "未設定"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {user.id}
                        </p>
                      </div>

                      <button
                        disabled={disabled}
                        onClick={() =>
                          toggleRole(user.id, user.role)
                        }
                        className={`px-4 py-2 rounded-lg ${
                          disabled
                            ? "bg-gray-600 opacity-40 cursor-not-allowed"
                            : user.role === "owner"
                            ? "bg-purple-700"
                            : user.role === "admin"
                            ? "bg-red-600"
                            : "bg-cyan-600"
                        }`}
                      >
                        {user.role}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* ===== ページネーション ===== */}
              <div className="mt-8 flex justify-between items-center">
                <p className="text-sm text-gray-400">
                  現在ページ: {page} / {Math.ceil(totalCount / pageSize)}
                </p>

                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 bg-slate-700 rounded disabled:opacity-50"
                  >
                    前へ
                  </button>

                  <button
                    disabled={page >= Math.ceil(totalCount / pageSize)}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 bg-slate-700 rounded disabled:opacity-50"
                  >
                    次へ
                  </button>
                </div>
              </div>

            </div>
          )}


          {/* ===== ニュース管理 ===== */}
          {activeTab === "news" && (
            <div className="bg-slate-800 p-4 md:p-8 rounded-2xl shadow space-y-6">

              <h1 className="text-2xl font-bold">
                最新情報管理
              </h1>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="タイトル"
                  value={newsTitle}
                  onChange={(e) =>
                    setNewsTitle(e.target.value)
                  }
                  className="w-full p-3 bg-slate-700 rounded"
                />

                <textarea
                  placeholder="内容"
                  value={newsContent}
                  onChange={(e) =>
                    setNewsContent(e.target.value)
                  }
                  rows={5}
                  className="w-full p-3 bg-slate-700 rounded"
                />

                <button
                  onClick={saveNews}
                  className="px-4 py-2 bg-cyan-600 rounded"
                >
                  {editingId ? "更新" : "作成"}
                </button>
              </div>

              <div className="space-y-4">
                {newsList.map((news) => (
                  <div
                    key={news.id}
                    className="bg-slate-700 p-4 rounded flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold">
                        {news.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(news.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          togglePublish(
                            news.id,
                            news.is_published
                          )
                        }
                        className={`px-3 py-1 rounded ${
                          news.is_published
                            ? "bg-green-600"
                            : "bg-gray-600"
                        }`}
                      >
                        {news.is_published
                          ? "公開中"
                          : "非公開"}
                      </button>

                      <button
                        onClick={() => {
                          setEditingId(news.id)
                          setNewsTitle(news.title)
                          setNewsContent(news.content)
                        }}
                        className="px-3 py-1 bg-yellow-600 rounded"
                      >
                        編集
                      </button>

                      <button
                        onClick={() =>
                          deleteNews(news.id)
                        }
                        className="px-3 py-1 bg-red-600 rounded"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}


          {/* ===== 統計 ===== */}
          {activeTab === "stats" && (
            <div className="bg-slate-800 p-4 md:p-8 rounded-2xl shadow">
              <h1 className="text-2xl font-bold">
                統計ページ（準備中）
              </h1>
            </div>
          )}


          {/* ===== ログ ===== */}
          {activeTab === "logs" && (
            <div className="bg-slate-800 p-4 md:p-8 rounded-2xl shadow">
              <h1 className="text-2xl font-bold">
                ログページ（準備中）
              </h1>
            </div>
          )}

        </div>
      </main>

    </div>
  )
}