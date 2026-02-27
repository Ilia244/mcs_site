"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {

  useEffect(() => {
    console.log("Supabase:", supabase)
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900 text-white flex flex-col items-center justify-center p-6">

      <h1 className="text-5xl font-bold mb-6 text-center drop-shadow-[0_0_20px_#00ffff]">
        Ilia Gaming Portal
      </h1>

      <p className="text-lg text-gray-300 mb-10 text-center max-w-xl">
        YouTube活動・マイクラ参加型情報・最新ニュースを発信中！
      </p>

      <div className="flex gap-6">
        <button className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 rounded-2xl shadow-[0_0_20px_#00ffff] hover:scale-110 transition-all">
          最新情報
        </button>

        <button className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-2xl shadow-[0_0_20px_#a855f7] hover:scale-110 transition-all">
          マイクラ参加型
        </button>
      </div>

    </main>
  )
}