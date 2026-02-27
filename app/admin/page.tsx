"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

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

  const [page, setPage] = useState(1)
  const pageSize = 10
  const [totalCount, setTotalCount] = useState(0)

  const [sortKey, setSortKey] =
    useState<"displayName" | "role" | "created_at">("created_at")
  const [sortOrder, setSortOrder] =
    useState<"asc" | "desc">("desc")

  const [activeTab, setActiveTab] =
    useState<"dashboard" | "users" | "news" | "stats" | "logs">("dashboard")

  const [newsList, setNewsList] = useState<News[]>([])
  const [newsTitle, setNewsTitle] = useState("")
  const [newsContent, setNewsContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  /* =========================
     初期認証チェック
  ========================== */
  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push("/account/login")
        return
      }

      const { data: me } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single()

      if (!me || me.role !== "admin") {
        router.push("/")
        return
      }

      await fetchUsers()
      await fetchNews()
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
    if (!loading) {
      fetchUsers()
    }
  }, [page, sortKey, sortOrder])

  /* =========================
     ニュース取得
  ========================== */
  const fetchNews = async () => {
    const { data } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false })

    setNewsList(data || [])
  }

  useEffect(() => {
    if (activeTab === "news") {
      fetchNews()
    }
  }, [activeTab])

  /* =========================
     ニュース保存（作成/更新）
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

    if (error) {
      console.error(error)
      return
    }

    setNewsTitle("")
    setNewsContent("")
    setEditingId(null)
    await fetchNews()
  }

  /* =========================
     公開切替
  ========================== */
  const togglePublish = async (
    id: string,
    current: boolean
  ) => {
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
  }

  /* =========================
     削除
  ========================== */
  const deleteNews = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return

    const { error } = await supabase.rpc("admin_delete_news", {
      news_id: id,
    })

    if (error) {
      console.error(error)
      return
    }

    fetchNews()
  }

  if (loading)
    return <div className="p-10 text-white">Loading...</div>

  return (
    <div className="min-h-screen flex text-white">

      {/* ===== サイドバー ===== */}
      <aside className="w-64 bg-slate-950 p-6 hidden lg:flex flex-col border-r border-slate-800">
        <h2 className="text-2xl font-bold mb-10">
          Admin
        </h2>

        <nav className="flex flex-col gap-2">
          {["dashboard", "users", "news", "stats", "logs"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
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
      <main className="flex-1 bg-slate-900 p-10">

        <div className="max-w-6xl mx-auto">

          {/* ===== ダッシュボード ===== */}
          {activeTab === "dashboard" && (
            <div className="bg-slate-800 p-8 rounded-2xl shadow">
              <h1 className="text-2xl font-bold mb-6">
                ダッシュボード
              </h1>

              <div className="grid grid-cols-3 gap-6">

                <div className="bg-slate-700 p-6 rounded-xl">
                  <p className="text-sm text-gray-400">総ユーザー数</p>
                  <p className="text-3xl font-bold">{totalCount}</p>
                </div>

                <div className="bg-slate-700 p-6 rounded-xl">
                  <p className="text-sm text-gray-400">登録ニュース数</p>
                  <p className="text-3xl font-bold">{newsList.length}</p>
                </div>

                <div className="bg-slate-700 p-6 rounded-xl">
                  <p className="text-sm text-gray-400">現在ページ</p>
                  <p className="text-3xl font-bold">{page}</p>
                </div>

              </div>
            </div>
          )}


          {/* ===== ユーザー管理 ===== */}
          {activeTab === "users" && (
            <div className="bg-slate-800 p-8 rounded-2xl shadow">

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
              <div className="grid grid-cols-2 gap-6">

                {users.map((user) => (
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
                      onClick={() =>
                        toggleRole(user.id, user.role)
                      }
                      className={`px-4 py-2 rounded-lg ${
                        user.role === "admin"
                          ? "bg-red-600"
                          : "bg-cyan-600"
                      }`}
                    >
                      {user.role}
                    </button>
                  </div>
                ))}

              </div>

            </div>
          )}


          {/* ===== ニュース管理 ===== */}
          {activeTab === "news" && (
            <div className="bg-slate-800 p-8 rounded-2xl shadow space-y-6">

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
            <div className="bg-slate-800 p-8 rounded-2xl shadow">
              <h1 className="text-2xl font-bold">
                統計ページ（準備中）
              </h1>
            </div>
          )}


          {/* ===== ログ ===== */}
          {activeTab === "logs" && (
            <div className="bg-slate-800 p-8 rounded-2xl shadow">
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