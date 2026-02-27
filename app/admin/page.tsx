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

  const [sortKey, setSortKey] =
    useState<"displayName" | "role" | "created_at">("created_at")

  const [sortOrder, setSortOrder] =
    useState<"asc" | "desc">("desc")

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
      setLoading(false)
    }

    init()
  }, [page, sortKey, sortOrder])

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

  if (loading)
    return <div className="p-10 text-white">Loading...</div>

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <div className="max-w-7xl mx-auto p-10">

        {/* タイトル */}
        <h1 className="text-3xl font-bold mb-8">
          Admin Dashboard
        </h1>

        {/* ===== 統計カード ===== */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
            <p className="text-sm text-gray-400">総ユーザー数</p>
            <p className="text-2xl font-bold mt-2">
              {totalCount}
            </p>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
            <p className="text-sm text-gray-400">現在ページ</p>
            <p className="text-2xl font-bold mt-2">
              {page}
            </p>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
            <p className="text-sm text-gray-400">ページサイズ</p>
            <p className="text-2xl font-bold mt-2">
              {pageSize}
            </p>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
            <p className="text-sm text-gray-400">ソート</p>
            <p className="text-2xl font-bold mt-2">
              {sortKey}
            </p>
          </div>
        </div>

        {/* ===== 操作バー ===== */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
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
                  sortOrder === "asc" ? "desc" : "asc"
                )
              }
              className="px-4 py-2 bg-slate-700 rounded"
            >
              {sortOrder === "asc" ? "昇順" : "降順"}
            </button>
          </div>
        </div>

        {/* ===== ユーザー一覧（グリッド） ===== */}
        <div className="grid grid-cols-2 gap-6">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-slate-800 p-6 rounded-2xl shadow-lg flex justify-between items-center"
            >
              <div>
                <p className="text-lg font-semibold">
                  {user.displayName || "未設定"}
                </p>
                <p className="text-xs text-gray-400">
                  {user.id}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  作成日:{" "}
                  {new Date(
                    user.created_at
                  ).toLocaleString()}
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

        {/* ===== ページネーション ===== */}
        <div className="flex justify-center gap-6 mt-10 items-center">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-5 py-2 bg-slate-700 rounded disabled:opacity-40"
          >
            前へ
          </button>

          <span className="text-lg">
            {page} / {Math.ceil(totalCount / pageSize)}
          </span>

          <button
            disabled={
              page >= Math.ceil(totalCount / pageSize)
            }
            onClick={() => setPage((p) => p + 1)}
            className="px-5 py-2 bg-slate-700 rounded disabled:opacity-40"
          >
            次へ
          </button>
        </div>

      </div>
    </div>
  )
}