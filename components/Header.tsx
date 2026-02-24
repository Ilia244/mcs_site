"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

export default function Header() {
  const [user, setUser] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // 外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-gradient-to-r from-purple-900 to-cyan-900 shadow-lg relative">
      <h1 className="text-xl font-bold text-cyan-400 drop-shadow-[0_0_10px_#00ffff]">
        Ilia Portal
      </h1>

      <div className="flex gap-6 items-center">
        <Link href="/" className="hover:text-cyan-400 transition">
          ホーム
        </Link>
        <Link href="/news" className="hover:text-cyan-400 transition">
          最新情報
        </Link>
        <Link href="/minecraft" className="hover:text-cyan-400 transition">
          マイクラ参加型
        </Link>
        <Link href="/rules" className="hover:text-cyan-400 transition">
          ルール
        </Link>

        {/* 認証ボタン */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="px-4 py-2 bg-cyan-500 rounded-xl hover:scale-110 transition shadow-[0_0_10px_#00ffff]"
          >
            {!user ? "ログイン" : "プロフィール"}
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl p-3 flex flex-col gap-3 z-50">

              {!user ? (
                <>
                  <Link
                    href="/account/login"
                    className="hover:text-cyan-400"
                    onClick={() => setOpen(false)}
                  >
                    ログイン
                  </Link>

                  <Link
                    href="/account/signup"
                    className="hover:text-purple-400"
                    onClick={() => setOpen(false)}
                  >
                    新規作成
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/account/profile"
                    className="hover:text-yellow-400"
                    onClick={() => setOpen(false)}
                  >
                    プロフィールへ
                  </Link>

                  <hr className="border-gray-700" />

                  <button
                    onClick={async () => {
                      await supabase.auth.signOut()
                      setOpen(false)
                    }}
                    className="text-red-400 hover:text-red-300 text-left"
                  >
                    ログアウト
                  </button>
                </>
              )}

            </div>
          )}
        </div>
      </div>
    </nav>
  )
}