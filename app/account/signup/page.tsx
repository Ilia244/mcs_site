"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function SignupPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [loading, setLoading] = useState(false)

  // 🔒 禁止ワード一覧
  const bannedNames = [
    "admin",
    "administrator",
    "mod",
    "moderator",
    "運営",
    "管理者",
    "関係者",
    "公式",
    "Ilia",
    "衣李亜",
    "Ilia./衣李亜"
  ]

  const isBannedName = (name: string) => {
    const lower = name.toLowerCase()
    return bannedNames.some((word) =>
      lower.includes(word.toLowerCase())
    )
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    const trimmedDisplayName = displayName.trim()
    const trimmedEmail = email.trim()

    if (!trimmedDisplayName || !trimmedEmail || !password) {
      setErrorMsg("すべての項目を入力してください")
      return
    }

    if (isBannedName(trimmedDisplayName)) {
      setErrorMsg("この表示名は使用できません")
      return
    }

    if (!trimmedEmail.includes("@")) {
      setErrorMsg("正しいメールアドレスを入力してください")
      return
    }

    if (password.length < 6) {
      setErrorMsg("パスワードは6文字以上必要です")
      return
    }

    setLoading(true)

    // ① ユーザー作成
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
    })

    if (error || !data.user) {
      setLoading(false)
      setErrorMsg("登録に失敗しました")
      return
    }

    // 🔥 ② INSERTはしない
    // ③ displayNameだけUPDATEする
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ displayName: trimmedDisplayName })
      .eq("id", data.user.id)

    if (updateError) {
      console.error(updateError)
      setLoading(false)
      setErrorMsg("プロフィール更新に失敗しました")
      return
    }

    setLoading(false)
    router.push("/")
    router.refresh()
  }

  const isDisabled =
    loading ||
    !displayName.trim() ||
    !email.trim() ||
    !password

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-cyan-900">
      <form
        onSubmit={handleSignup}
        className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-96 flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold text-cyan-400 text-center">
          アカウント作成
        </h2>

        <input
          type="text"
          placeholder="表示名"
          required
          className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-400 outline-none"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <input
          type="email"
          placeholder="メールアドレス"
          required
          className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-400 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="パスワード"
          required
          minLength={6}
          className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-400 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorMsg && (
          <p className="text-red-400 text-sm">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={isDisabled}
          className="bg-cyan-500 hover:scale-105 transition p-3 rounded-lg font-bold disabled:opacity-50"
        >
          {loading ? "作成中..." : "アカウント作成"}
        </button>

        <p className="text-sm text-center">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/account/login" className="text-cyan-400">
            ログイン
          </Link>
        </p>
      </form>
    </div>
  )
}