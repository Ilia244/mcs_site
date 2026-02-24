"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Profile() {
  const [file, setFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [nickname, setNickname] = useState<string>("")
  const [newNickname, setNewNickname] = useState<string>("")
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  // 初期読み込み
  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) return

      const user = data.user

      // アバターURL取得
      const { data: publicUrlData } = supabase
        .storage
        .from("avatars")
        .getPublicUrl(`${user.id}.png`)

      setAvatarUrl(publicUrlData.publicUrl)

      // プロフィール取得
      const { data: profileData } = await supabase
        .from("profiles")
        .select("nickname, is_admin")
        .eq("id", user.id)
        .single()

      if (profileData) {
        setNickname(profileData.nickname || "")
        setNewNickname(profileData.nickname || "")
        setIsAdmin(profileData.is_admin || false)
      }
    }

    loadProfile()
  }, [])

  // ニックネーム更新
  const updateNickname = async () => {
    if (!newNickname.trim()) {
      alert("ニックネームを入力してください")
      return
    }

    if (newNickname.length < 3 || newNickname.length > 20) {
      alert("3〜20文字で入力してください")
      return
    }

    setLoading(true)

    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      alert("ログインしてください")
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from("profiles")
      .update({ nickname: newNickname.trim() })
      .eq("id", data.user.id)

    if (error) {
      console.error(error)
      alert("更新に失敗しました")
    } else {
      setNickname(newNickname.trim())
      alert("ニックネームを更新しました")
    }

    setLoading(false)
  }

  // アバターアップロード
  const uploadAvatar = async () => {
    if (!file) {
      alert("画像を選択してください")
      return
    }

    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      alert("ログインしてください")
      return
    }

    const user = data.user
    const filePath = `${user.id}.png`

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true })

    if (error) {
      console.error(error)
      alert("アップロード失敗")
    } else {
      alert("アップロード成功")
      location.reload()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center gap-6 p-8">

      <h1 className="text-2xl font-bold">プロフィール</h1>

      {/* アバター表示 */}
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt="avatar"
          className="w-32 h-32 rounded-full object-cover border-4 border-purple-500"
        />
      )}

      {/* 現在のニックネーム */}
      <div className="flex items-center gap-3">
        <span className="text-xl font-semibold">
          {nickname || "ニックネーム未設定"}
        </span>

        {isAdmin && (
          <span className="bg-yellow-400 text-black px-2 py-1 rounded text-sm font-bold">
            ADMIN
          </span>
        )}
      </div>

      {/* ニックネーム変更 */}
      <div className="flex flex-col items-center gap-2 w-full max-w-sm">
        <input
          type="text"
          value={newNickname}
          onChange={(e) => setNewNickname(e.target.value)}
          className="border p-2 w-full rounded"
          placeholder="新しいニックネーム"
        />

        <button
          onClick={updateNickname}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full"
        >
          {loading ? "更新中..." : "ニックネームを変更"}
        </button>
      </div>

      {/* 画像選択 */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      {/* アップロードボタン */}
      <button
        onClick={uploadAvatar}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
      >
        アバターをアップロード
      </button>

    </div>
  )
}