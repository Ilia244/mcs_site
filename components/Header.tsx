"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/providers/AuthProvider"
import RoleBadge from "@/components/RoleBadge"
import { hasPermission } from "@/lib/role"
import NotificationBell from "@/components/NotificationBell"

export default function Header() {
  const { user, profile, loading } = useAuth()
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const role = profile?.role || (profile?.is_admin ? "admin" : "user")
  const displayName = profile?.displayName || "未設定"
  const canAccessAdmin = hasPermission(role, 80)
  const avatarUrl = user
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}.png`
    : ""

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setOpen(false)
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  const logout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("ログアウトエラー:", error)
      return
    }

    setOpen(false)
    setMenuOpen(false)
    router.replace("/")
    router.refresh()
  }

  const links: [string, string][] = [
    ["/", "ホーム"],
    ["/minecraft", "MCS"],
    ["/join", "🎮 参加する"],
    ["/news", "最新情報"],
    ["/youtube", "YouTube"],
    ["/app/terratech-calculator", "TerraTech"],
  ]

  return (
    <nav className="portal-nav">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="font-bold tracking-tight text-cyan-300 text-center leading-tight min-w-0 max-w-[180px]"
        >
          Ilia./衣李亜
          <span className="block text-[9px] tracking-[0.25em] text-gray-500">
            OFFICIAL PORTAL
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-5 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="nav-link">
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {user && <NotificationBell />}

          <div className="relative lg:hidden" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="px-3 py-2 rounded-lg bg-white/10"
              aria-label="メニュー"
            >
              ☰
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 portal-menu">
                {links.map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              disabled={loading}
              onClick={() => setOpen((value) => !value)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/15 border border-cyan-400/20 hover:bg-cyan-500/25 disabled:opacity-60"
            >
              {!user ? (
                "ログイン"
              ) : (
                <>
                  <img
                    src={avatarUrl || "/default_avatar.png"}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover border border-white/20"
                    onError={(event) => {
                      event.currentTarget.src = "/default_avatar.png"
                    }}
                  />
                  <span className="max-w-[90px] truncate hidden sm:inline">
                    {displayName}
                  </span>
                  <RoleBadge role={role} />
                </>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-52 portal-menu">
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
                    {canAccessAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className="text-red-400"
                      >
                        管理画面
                      </Link>
                    )}
                    <hr className="border-white/10" />
                    <button
                      type="button"
                      onClick={logout}
                      className="text-left text-red-400"
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
