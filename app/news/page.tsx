"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type News = {
  id: string
  title: string
  content: string
  created_at: string
}

export default function NewsPage() {
  const [newsList, setNewsList] = useState<News[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const pageSize = 5

  useEffect(() => {
    const fetchNews = async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, count, error } = await supabase
        .from("news")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) {
        console.error(error)
        return
      }

      setNewsList(data || [])
      setTotalCount(count || 0)
      setLoading(false)
    }

    fetchNews()
  }, [page])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold text-cyan-400 mb-8">
        最新情報
      </h1>

      {loading && <p>読み込み中...</p>}

      {!loading && newsList.length === 0 && (
        <p className="text-gray-400">
          お知らせはまだありません。
        </p>
      )}

      <div className="space-y-6">
        {newsList.map((news) => (
          <div
            key={news.id}
            className="bg-slate-800 p-6 rounded-xl shadow"
          >
            <h2 className="text-xl font-semibold">
              {news.title}
            </h2>

            <p className="text-gray-400 text-sm mt-1">
              {new Date(news.created_at).toLocaleDateString()}
            </p>

            <p className="mt-4 whitespace-pre-wrap">
              {news.content}
            </p>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-slate-700 rounded disabled:opacity-40"
          >
            前へ
          </button>

          <span>
            {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-slate-700 rounded disabled:opacity-40"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  )
}