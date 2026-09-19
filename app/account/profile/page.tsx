"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/providers/AuthProvider"
import PushNotificationSettings from "@/components/PushNotificationSettings"

export default function Profile() {
  const router = useRouter()
  const { user, profile, accessToken, loading: authLoading, refreshProfile } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [newDisplayName, setNewDisplayName] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [minecraftId, setMinecraftId] = useState("")
  const [minecraftUuid, setMinecraftUuid] = useState("")
  const [savingMinecraft, setSavingMinecraft] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/account/login")
  }, [authLoading, user, router])

  useEffect(() => {
    setNewDisplayName(profile?.displayName || "")
    setMinecraftId(profile?.minecraft_id || "")
    setMinecraftUuid(profile?.minecraft_uuid || "")
  }, [profile?.displayName, profile?.minecraft_id, profile?.minecraft_uuid])

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

  const saveMinecraftId = async () => {
    setMessage("")
    setErrorMessage("")
    const value = minecraftId.trim()
    if (!user) { setErrorMessage("ログインしてください"); return }
    if (!/^[A-Za-z0-9_]{3,16}$/.test(value)) {
      setErrorMessage("Minecraft IDは3〜16文字の英数字または_で入力してください")
      return
    }
    if (!accessToken) { setErrorMessage("ログインセッションを確認できません"); return }
    setSavingMinecraft(true)
    try {
      const response = await fetch("/api/minecraft/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ minecraftId: value }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Minecraftアカウントの登録に失敗しました")
      setMinecraftId(data.minecraft_id || value)
      setMinecraftUuid(data.minecraft_uuid || "")
      await refreshProfile()
      setMessage("Minecraft IDを登録しました。UUIDと紐付けています。")
    } catch (error: any) {
      setErrorMessage(error?.message || "Minecraftアカウントの登録に失敗しました")
    } finally {
      setSavingMinecraft(false)
    }
  }

  const uploadAvatar = async (selectedFile?: File) => {
    setMessage("")
    setErrorMessage("")

    const targetFile = selectedFile || file

    if (!targetFile) {
      setErrorMessage("画像を選択してください")
      return
    }

    if (!user) {
      setErrorMessage("ログインしてください")
      return
    }

    if (!targetFile.type.startsWith("image/")) {
      setErrorMessage("画像ファイルを選択してください")
      return
    }

    if (targetFile.size > 5 * 1024 * 1024) {
      setErrorMessage("画像は5MB以下にしてください")
      return
    }

    setUploading(true)
    setFile(targetFile)
    const nextPreviewUrl = URL.createObjectURL(targetFile)
    setPreviewUrl(nextPreviewUrl)

    try {
      const filePath = `${user.id}.png`
      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, targetFile, {
          upsert: true,
          contentType: targetFile.type || "image/png",
          cacheControl: "3600",
        })

      if (error) {
        console.error(error)
        setErrorMessage("アバターのアップロードに失敗しました")
        return
      }

      setAvatarUrl(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}.png?v=${Date.now()}`,
      )
      setFile(null)
      setPreviewUrl(null)
      setMessage("アバターを更新しました")
    } finally {
      setUploading(false)
    }
  }


  if (authLoading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">読み込み中...</div>
  }

  if (!user) return null

  const role = profile?.role || (profile?.is_admin ? "admin" : "user")
  const isAdmin = role === "admin" || role === "owner"

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-900 via-black to-indigo-900">
      <div className="relative backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 w-full max-w-md text-white flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold pr-28 sm:pr-32">プロフィール</h1>

        {/* 通知設定：プロフィールカード右上 */}
        <div className="absolute top-4 right-4 w-40 sm:w-48 z-20">
          <PushNotificationSettings compact />
        </div>

        {message && <div className="w-full text-center text-green-400 text-sm">{message}</div>}
        {errorMessage && <div className="w-full text-center text-red-400 text-sm">{errorMessage}</div>}

        {/* 01. 表示名・プロフィール画像 */}
        <section className="w-full rounded-2xl border border-purple-400/20 bg-purple-400/5 p-5">
          <div className="text-sm font-bold text-purple-300 mb-4">プロフィール</div>

          <div className="flex flex-col items-center gap-4">
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

            <div className="w-full flex flex-col gap-3">
              <label className="text-xs text-gray-300">表示名</label>
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

            <div className="w-full">
              <label
                htmlFor="avatar-upload"
                className={`cursor-pointer flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-[1.02] transition transform shadow-lg text-sm font-semibold ${uploading ? "pointer-events-none opacity-50" : ""}`}
              >
                {uploading ? "アップロード中..." : "📁 プロフィール画像を変更"}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const selected = e.target.files?.[0]
                  e.currentTarget.value = ""
                  if (selected) void uploadAvatar(selected)
                }}
              />
              <p className="text-[11px] text-gray-500 text-center mt-2">画像を選択すると自動でアップロードされます（5MB以下）</p>
            </div>
          </div>
        </section>

        {/* 02. Minecraftアカウント連携 */}
        <section className="w-full rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
          <div className="text-sm font-bold text-cyan-300">Minecraftアカウント</div>
          <p className="text-xs text-gray-400 mt-1">
            Minecraft IDからUUIDを取得してWebアカウントと紐付けます。Minecraft側で名前を変更した場合も自動で更新します。
          </p>

          <div className="mt-3 flex flex-col gap-2">
            <label className="text-xs text-gray-300">Minecraft ID</label>
            <input
              type="text"
              value={minecraftId}
              maxLength={16}
              onChange={(e) => setMinecraftId(e.target.value)}
              className="p-3 rounded-lg bg-black/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="例: Ilia244"
            />
            <button
              type="button"
              onClick={saveMinecraftId}
              disabled={savingMinecraft}
              className="py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-[1.02] transition transform shadow-lg font-semibold disabled:opacity-50"
            >
              {savingMinecraft ? "確認・登録中..." : minecraftUuid ? "Minecraft IDを更新" : "Minecraft IDを登録"}
            </button>
          </div>

          {minecraftUuid && (
            <div className="mt-3 text-xs text-gray-400 break-all">
              UUID: <span className="text-gray-200">{minecraftUuid}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  )
