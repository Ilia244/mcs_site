"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

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
  "Ilia./衣李亜",
]

export default function SignupPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [loading, setLoading] = useState(false)

  const isBannedName = (name: string) => {
    const lower = name.toLowerCase()
    return bannedNames.some((word) => lower.includes(word.toLowerCase()))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")

    const trimmedDisplayName = displayName.trim()
    const trimmedEmail = email.trim()

    if (!trimmedDisplayName || !trimmedEmail || !password) {
      setErrorMsg("すべての項目を入力してください")
      return
    }

    if (trimmedDisplayName.length < 3 || trimmedDisplayName.length > 20) {
      setErrorMsg("表示名は3〜20文字で入力してください")
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

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          displayName: trimmedDisplayName,
        },
      },
    })

    if (error || !data.user) {
      console.error("登録エラー:", error)
      setLoading(false)
      setErrorMsg(error?.message || "登録に失敗しました")
      return
    }

    // メール確認がOFFなら、その場でプロフィールを確実に保存。
    // メール確認ONの場合はDB triggerがAuthユーザー作成時に保存します。
    if (data.session) {
      const { error: profileError } = await supabase.rpc(
        "update_my_display_name",
        { new_display_name: trimmedDisplayName },
      )

      if (profileError) {
        console.error("プロフィール保存エラー:", profileError)
        setLoading(false)
        setErrorMsg("プロフィールの保存に失敗しました")
        return
      }

      setLoading(false)
      router.replace("/")
      router.refresh()
      return
    }

    setLoading(false)
    setSuccessMsg(
      "アカウントを作成しました。登録したメールアドレスに確認メールが届いている場合は、確認後にログインしてください。",
    )
  }

  const isDisabled =
    loading || !displayName.trim() || !email.trim() || !password

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-900 to-cyan-900">
      <form
        onSubmit={handleSignup}
        className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold text-cyan-400 text-center">アカウント作成</h2>

        <input
          type="text"
          placeholder="表示名"
          required
          minLength={3}
          maxLength={20}
          autoComplete="nickname"
          className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-400 outline-none"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <input
          type="email"
          placeholder="メールアドレス"
          required
          autoComplete="email"
          className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-400 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="パスワード"
          required
          minLength={6}
          autoComplete="new-password"
          className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-400 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
        {successMsg && <p className="text-green-400 text-sm">{successMsg}</p>}

        <button
          type="submit"
          disabled={isDisabled}
          className="bg-cyan-500 hover:scale-[1.02] transition p-3 rounded-lg font-bold disabled:opacity-50"
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
