"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/providers/AuthProvider"

export default function Header() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [role, setRole] = useState("user")
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setDisplayName("")
        setAvatarUrl("")
        setRole("user")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("displayName, role")
        .eq("id", user.id)
        .single()

      setDisplayName(profile?.displayName || "")
      setRole(profile?.role || "user")

      const { data: publicUrlData } = supabase
        .storage
        .from("avatars")
        .getPublicUrl(`${user.id}.png`)

      setAvatarUrl(publicUrlData.publicUrl)
    }

    loadProfile()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setOpen(false)
    router.refresh() // ← これ重要
  }

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
        Ilia./衣李亜 | MCS公式
      </h1>

      <div className="flex gap-6 items-center">
        <Link href="/">ホーム</Link>
        <Link href="/news">最新情報</Link>
        <Link href="/minecraft">マイクラ参加型</Link>
        <Link href="/rules">ルール</Link>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 rounded-xl hover:scale-110 transition shadow-[0_0_10px_#00ffff]"
          >
            {!user ? (
              "ログイン"
            ) : (
              <>
                <img
                  src={avatarUrl || "/default_avatar.png"}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover border border-white/30"
                />
                <div className="flex items-center gap-2">
                  <span>{displayName || "未設定"}</span>

                  {role === "admin" && (
                    <span className="px-2 py-0.5 text-xs bg-red-600 rounded-md shadow">
                      ADMIN
                    </span>
                  )}
                </div>
              </>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl p-3 flex flex-col gap-3 z-50">
              {!user ? (
                <>
                  <Link href="/account/login" onClick={() => setOpen(false)}>
                    ログイン
                  </Link>
                  <Link href="/account/signup" onClick={() => setOpen(false)}>
                    新規作成
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/account/profile"
                    onClick={() => setOpen(false)}
                  >
                    プロフィールへ
                  </Link>

                  <hr className="border-gray-700" />

                  <button
                    onClick={handleLogout}
                    className="text-red-400 text-left"
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