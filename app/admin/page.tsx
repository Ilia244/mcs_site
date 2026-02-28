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

export default function AdminPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<Profile[]>([])

  const [page, setPage] = useState(1)
  const pageSize = 10
  const [totalCount, setTotalCount] = useState(0)

  const [sortKey, setSortKey] =  useState<"displayName" | "role" | "created_at">("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "news" | "stats" | "logs">("dashboard")

  const [newsList, setNewsList] = useState<any[]>([])
  const [newsTitle, setNewsTitle] = useState("")
  const [newsContent, setNewsContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchUsers = async () => {
    const { data, error } = await supabase.rpc(
      "admin_get_profiles_paginated",
      {
        page_number: page,
        page_size: pageSize,
        sort_column: sortKey,
        sort_direction: sortOrder,
      }
    )

    if (error) {
      console.error(error)
      return
    }

    setUsers(data || [])

    const { data: count } =
      await supabase.rpc("admin_get_profiles_count")

    setTotalCount(count || 0)
    
  }

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
  }, [page, sortKey, sortOrder])

  useEffect(() => {
    if (activeTab === "news") {
      fetchNews()
    }
  }, [activeTab])

  const toggleRole = async (
    id: string,
    currentRole: string
  ) => {
    const newRole =
      currentRole === "admin" ? "user" : "admin"

    const { error } = await supabase.rpc(
      "admin_update_role",
      {
        target_id: id,
        new_role: newRole,
      }
    )

    if (error) {
      console.error(error)
      return
    }

    fetchUsers()
  }

  const fetchNews = async () => {
    const { data } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false })

    setNewsList(data || [])
  }

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

  const deleteNews = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return

    const { error } = await supabase.rpc("admin_delete_news", {
      news_id: id,
    })

    if (error) {
      console.error(error)
      return
    }

    await fetchNews()
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

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`text-left px-4 py-2 rounded-lg transition ${
              activeTab === "dashboard"
                ? "bg-slate-800"
                : "hover:bg-slate-900"
            }`}
          >
            ダッシュボード
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`text-left px-4 py-2 rounded-lg transition ${
              activeTab === "users"
                ? "bg-slate-800"
                : "hover:bg-slate-900"
            }`}
          >
            ユーザー管理
          </button>

          <button
            onClick={() => setActiveTab("news")}
            className={`text-left px-4 py-2 rounded-lg transition ${
              activeTab === "news"
                ? "bg-slate-800"
                : "hover:bg-slate-900"
            }`}
          >
            最新情報管理
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`text-left px-4 py-2 rounded-lg transition ${
              activeTab === "stats"
                ? "bg-slate-800"
                : "hover:bg-slate-900"
            }`}
          >
            統計
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`text-left px-4 py-2 rounded-lg transition ${
              activeTab === "logs"
                ? "bg-slate-800"
                : "hover:bg-slate-900"
            }`}
          >
            ログ
          </button>

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


          {/* ===== News管理 ===== */}
          {activeTab === "news" && (
            <div className="bg-slate-800 p-8 rounded-2xl shadow">

              <h1 className="text-2xl font-bold mb-6">
                最新情報管理
              </h1>

              {/* 入力フォーム */}
              <div className="flex flex-col gap-4 mb-8">

                <input
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  placeholder="タイトル"
                  className="px-4 py-2 rounded bg-slate-700"
                />

                <textarea
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  placeholder="内容"
                  className="px-4 py-2 rounded bg-slate-700 h-32"
                />

                <button
                  onClick={saveNews}
                  className="px-4 py-2 bg-cyan-600 rounded"
                >
                  {editingId ? "更新する" : "作成する"}
                </button>

              </div>

              {/* 一覧 */}
              <div className="space-y-4">

                {newsList.map((news) => (
                  <div
                    key={news.id}
                    className="bg-slate-700 p-6 rounded-xl"
                  >
                    <h2 className="font-semibold">
                      {news.title}
                    </h2>

                    <p className="text-sm text-gray-300 mt-2">
                      {news.content}
                    </p>

                    <div className="flex gap-4 mt-4">

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
                        onClick={() => deleteNews(news.id)}
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