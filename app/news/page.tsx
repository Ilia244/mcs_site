"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type News = {
  id: string
  title: string
  content: string
  created_at: string
  is_published: boolean
}

export default function NewsPage() {
  const [newsList, setNewsList] = useState<News[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const init = async () => {
      // ユーザー取得
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (profile?.role === "admin") {
          setIsAdmin(true)
        }
      }

      // ニュース取得（RLSに任せる）
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error(error)
        return
      }

      setNewsList(data ?? [])
    }

    init()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold text-cyan-400">
        最新情報
      </h1>

      <div className="mt-8 space-y-6">
        {newsList.map((news) => (
          <div
            key={news.id}
            className={`bg-slate-800 p-6 rounded-xl border
              ${!news.is_published ? "opacity-70 border-red-500" : "border-slate-700"}
            `}
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">
                {news.title}
              </h2>

              {/* 非公開バッジ */}
              {isAdmin && !news.is_published && (
                <span className="px-3 py-1 text-xs rounded-full bg-red-600 text-white">
                  非公開
                </span>
              )}
            </div>

            <p className="text-sm text-gray-400 mb-2">
              {new Date(news.created_at).toLocaleDateString()}
            </p>

            <p>{news.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}