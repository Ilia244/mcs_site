"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/providers/AuthProvider"

export default function Profile() {
  const router = useRouter()
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [newDisplayName, setNewDisplayName] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!authLoading && !user) router.replace("/account/login")
  }, [authLoading, user, router])

  useEffect(() => {
    setNewDisplayName(profile?.displayName || "")
  }, [profile?.displayName])

  useEffect(() => {
    if (!user) {
      setAvatarUrl("")
      return
    }

    const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}.png`
    setAvatarUrl(`${base}?v=${Date.now()}`)
  }, [user, profile])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const updateDisplayName = async () => {
    setMessage("")
    setErrorMessage("")

    const value = newDisplayName.trim()

    if (!value) {
      setErrorMessage("表示名を入力してください")
      return
    }

    if (value.length < 3 || value.length > 20) {
      setErrorMessage("3〜20文字で入力してください")
      return
    }

    if (!user) {
      setErrorMessage("ログインしてください")
      return
    }

    setSaving(true)

    const { error } = await supabase.rpc("update_my_display_name", {
      new_display_name: value,
    })

    if (error) {
      console.error(error)
      setErrorMessage("表示名の更新に失敗しました")
    } else {
      await refreshProfile()
      setMessage("表示名を更新しました")
    }

    setSaving(false)
  }

  const uploadAvatar = async () => {
    setMessage("")
    setErrorMessage("")

    if (!file) {
      setErrorMessage("画像を選択してください")
      return
    }

    if (!user) {
      setErrorMessage("ログインしてください")
      return
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("画像ファイルを選択してください")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("画像は5MB以下にしてください")
      return
    }

    setUploading(true)

    const filePath = `${user.id}.png`
    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
        contentType: "image/png",
        cacheControl: "3600",
      })

    if (error) {
      console.error(error)
      setErrorMessage("アバターのアップロードに失敗しました")
    } else {
      setAvatarUrl(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}.png?v=${Date.now()}`,
      )
      setPreviewUrl(null)
      setFile(null)
      setMessage("アバターを更新しました")
    }

    setUploading(false)
  }

  if (authLoading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">読み込み中...</div>
  }

  if (!user) return null

  const role = profile?.role || (profile?.is_admin ? "admin" : "user")
  const isAdmin = role === "admin" || role === "owner"

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-900 via-black to-indigo-900">
      <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 w-full max-w-md text-white flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold">プロフィール</h1>

        <div className="relative group">
          <img
            src={previewUrl || avatarUrl || "/default_avatar.png"}
            alt="avatar"
            onError={(event) => {
              event.currentTarget.src = "/default_avatar.png"
            }}
            className="w-32 h-32 rounded-full object-cover border-4 border-purple-400 shadow-lg cursor-pointer transition group-hover:brightness-75"
            onClick={() => document.getElementById("avatar-upload")?.click()}
          />
          <div
            onClick={() => document.getElementById("avatar-upload")?.click()}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition cursor-pointer text-sm font-semibold"
          >
            変更
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <span className={`text-2xl font-semibold ${isAdmin ? "bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent" : ""}`}>
            {profile?.displayName || "表示名未設定"}
          </span>
          {isAdmin && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-red-500 text-black shadow-md">
              {role.toUpperCase()}
            </span>
          )}
        </div>

        <div className="text-xs text-gray-400 break-all text-center">{user.email}</div>

        {message && <div className="w-full text-center text-green-400 text-sm">{message}</div>}
        {errorMessage && <div className="w-full text-center text-red-400 text-sm">{errorMessage}</div>}

        <div className="w-full flex flex-col gap-3">
          <input
            type="text"
            value={newDisplayName}
            maxLength={20}
            onChange={(e) => setNewDisplayName(e.target.value)}
            className="p-3 rounded-lg bg-black/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="新しい表示名"
          />
          <button
            type="button"
            onClick={updateDisplayName}
            disabled={saving}
            className="py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:scale-[1.02] transition transform shadow-lg font-semibold disabled:opacity-50"
          >
            {saving ? "更新中..." : "表示名を変更"}
          </button>
        </div>

        <div className="w-full flex flex-col gap-3">
          <label
            htmlFor="avatar-upload"
            className="cursor-pointer flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition shadow-lg text-sm font-medium"
          >
            📁 画像を選択
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0]
              if (!selected) return
              setFile(selected)
              setPreviewUrl(URL.createObjectURL(selected))
            }}
          />
          {file && <div className="text-xs text-gray-300 text-center">選択中: {file.name}</div>}
          <button
            type="button"
            onClick={uploadAvatar}
            disabled={!file || uploading}
            className="py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-[1.02] transition transform shadow-lg font-semibold disabled:opacity-50"
          >
            {uploading ? "アップロード中..." : "アバターをアップロード"}
          </button>
        </div>
      </div>
    </div>
  )
}
