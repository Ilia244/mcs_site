"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Profile() {
  const [file, setFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>("")
  const [newDisplayName, setNewDisplayName] = useState<string>("")
  const [role, setRole] = useState<"user" | "admin">("user")
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) return

      const user = data.user

      const { data: publicUrlData } = supabase
        .storage
        .from("avatars")
        .getPublicUrl(`${user.id}.png`)

      setAvatarUrl(publicUrlData.publicUrl)

      const { data: profileData } = await supabase
        .from("profiles")
        .select("displayName, role")
        .eq("id", user.id)
        .single()

      if (profileData) {
        setDisplayName(profileData.displayName || "")
        setNewDisplayName(profileData.displayName || "")
        setRole(profileData.role ?? "user")
        setIsAdmin(profileData.role === "admin")
      }
    }

    loadProfile()
  }, [])

  const updateDisplayName = async () => {
    setMessage("")
    setErrorMessage("")

    if (!newDisplayName.trim()) {
      setErrorMessage("表示名を入力してください")
      return
    }

    if (newDisplayName.length < 3 || newDisplayName.length > 20) {
      setErrorMessage("3〜20文字で入力してください")
      return
    }

    setLoading(true)

    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      setErrorMessage("ログインしてください")
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from("profiles")
      .update({ displayName: newDisplayName.trim() })
      .eq("id", data.user.id)

    if (error) {
      setErrorMessage("更新に失敗しました")
    } else {
      setDisplayName(newDisplayName.trim())
      setMessage("表示名を更新しました")
    }

    setLoading(false)
  }

  const uploadAvatar = async () => {
    if (!file) {
      setErrorMessage("画像を選択してください")
      return
    }

    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      setErrorMessage("ログインしてください")
      return
    }

    const filePath = `${data.user.id}.png`

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true })

    if (error) {
      setErrorMessage("アップロード失敗")
    } else {
      setMessage("アップロード成功")
      location.reload()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-900 via-black to-indigo-900">

      <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 w-full max-w-md text-white flex flex-col items-center gap-6">

        <h1 className="text-3xl font-bold">プロフィール</h1>

        <div className="relative group">

        <img
          src={previewUrl || avatarUrl || "/default_avatar.png"}
          alt="avatar"
          onError={(e) => {
            e.currentTarget.src = "/default_avatar.png"
          }}
          onClick={() => document.getElementById("avatar-upload")?.click()}
          className="w-32 h-32 rounded-full object-cover border-4 border-purple-400 shadow-lg cursor-pointer transition group-hover:brightness-75"
        />

        {/* ホバー時オーバーレイ */}
        <div
            onClick={() => document.getElementById("avatar-upload")?.click()}
            className="absolute inset-0 flex items-center justify-center
                    rounded-full bg-black/50 opacity-0 group-hover:opacity-100
                    transition cursor-pointer text-sm font-semibold"
        >
            変更
        </div>
        </div>

        {/* 表示名表示 */}
        <div className="flex items-center gap-3">
          <span
            className={`text-2xl font-semibold ${
              isAdmin
                ? "bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent"
                : ""
            }`}
          >
            {displayName || "表示名未設定"}
          </span>

          {isAdmin && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-red-500 text-black shadow-md">
              ADMIN
            </span>
          )}
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className="w-full text-center text-green-400 text-sm">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="w-full text-center text-red-400 text-sm">
            {errorMessage}
          </div>
        )}

        {/* 表示名編集 */}
        <div className="w-full flex flex-col gap-3">
          <input
            type="text"
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
            className="p-3 rounded-lg bg-black/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="新しい表示名"
          />

          <button
            onClick={updateDisplayName}
            disabled={loading}
            className="py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:scale-105 transition transform shadow-lg font-semibold"
          >
            {loading ? "更新中..." : "表示名を変更"}
          </button>
        </div>

        {/* アバター変更 */}
        <div className="w-full flex flex-col gap-3">
            {/* カスタムファイル選択 */}
            <div className="w-full flex flex-col gap-3">

            <label
                htmlFor="avatar-upload"
                className="cursor-pointer flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                        bg-white/10 border border-white/20 hover:bg-white/20
                        transition shadow-lg text-sm font-medium"
            >
                📁 画像を選択
            </label>

            <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
                const selected = e.target.files?.[0]
                if (!selected) return

                setFile(selected)

                // 即プレビュー生成
                const objectUrl = URL.createObjectURL(selected)
                setPreviewUrl(objectUrl)
            }}
            />

            {file && (
                <div className="text-xs text-gray-300 text-center">
                選択中: {file.name}
                </div>
            )}
            </div>

          <button
            onClick={uploadAvatar}
            className="py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-105 transition transform shadow-lg font-semibold"
          >
            アバターをアップロード
          </button>
        </div>

      </div>
    </div>
  )
}