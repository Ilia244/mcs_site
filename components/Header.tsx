"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/providers/AuthProvider"
import RoleBadge from "@/components/RoleBadge"
import { hasPermission } from "@/lib/role"

export default function Header() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [role, setRole] = useState("user")
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("displayName, role")
        .eq("id", user.id)
        .maybeSingle()

      if (profile) {
        setDisplayName(profile.displayName || "")
        setRole(profile.role || "user")
      }

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(`${user.id}.png`)

      setAvatarUrl(data.publicUrl)
    }

    loadProfile()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setOpen(false)
    setMenuOpen(false)
    router.refresh()
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ✅ 管理画面は level80以上
  const canAccessAdmin = hasPermission(role, 80)

  return (
    <nav className="w-full bg-gradient-to-r from-purple-900 to-cyan-900 shadow-lg px-6 py-4 relative">
      <div className="flex justify-between items-center w-full">

        <h1 className="text-lg lg:text-xl font-bold text-cyan-400 whitespace-nowrap">
          Ilia./衣李亜 | MCS公式
        </h1>

        <div className="flex items-center gap-4">

          {/* PCナビ */}
          <div className="hidden lg:flex gap-6 text-sm">
            <Link href="/" className="hover:text-cyan-400 transition">ホーム</Link>
            <Link href="/news" className="hover:text-cyan-400 transition">最新情報</Link>
            <Link href="/minecraft" className="hover:text-cyan-400 transition">マイクラ参加型</Link>
            <Link href="/app/terratech-calculator" className="hover:text-cyan-400 transition">TerraTech</Link>
            <Link href="/rules" className="hover:text-cyan-400 transition">ルール</Link>
          </div>

          {/* モバイルメニュー */}
          <div className="relative lg:hidden" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-2xl"
            >
              ☰
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-3 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-4 flex flex-col gap-3 text-sm z-50">
                <Link href="/" onClick={() => setMenuOpen(false)}>ホーム</Link>
                <Link href="/news" onClick={() => setMenuOpen(false)}>最新情報</Link>
                <Link href="/minecraft" onClick={() => setMenuOpen(false)}>マイクラ参加型</Link>
                <Link href="/app/terratech-calculator" onClick={() => setMenuOpen(false)}>TerraTech</Link>
                <Link href="/rules" onClick={() => setMenuOpen(false)}>ルール</Link>
              </div>
            )}
          </div>

          {/* アカウント */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 px-3 py-2 bg-cyan-500 rounded-xl hover:scale-105 transition min-w-0"
            >
              {!user ? (
                "ログイン"
              ) : (
                <>
                  <img
                    src={avatarUrl || "/default_avatar.png"}
                    alt="avatar"
                    onError={(e) => {
                      e.currentTarget.src = "/default_avatar.png"
                    }}
                    className="w-8 h-8 rounded-full object-cover border border-white/30 shrink-0"
                  />
                  <span className="max-w-[100px] truncate">
                    {displayName || "未設定"}
                  </span>
                  <RoleBadge role={role} />
                </>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-xl p-3 flex flex-col gap-3 text-sm z-50">
                {!user ? (
                  <>
                    <Link href="/account/login">ログイン</Link>
                    <Link href="/account/signup">新規作成</Link>
                  </>
                ) : (
                  <>
                    <Link href="/account/profile">プロフィールへ</Link>

                    {canAccessAdmin && (
                      <Link href="/admin" className="text-red-400">
                        管理画面
                      </Link>
                    )}

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
      </div>
    </nav>
  )
}