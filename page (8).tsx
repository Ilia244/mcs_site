"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!email.includes("@")) {
      setErrorMsg("正しいメールアドレスを入力してください")
      return
    }

    if (password.length < 6) {
      setErrorMsg("パスワードは6文字以上必要です")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setErrorMsg("ログインに失敗しました")
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-cyan-900">
      <form
        onSubmit={handleLogin}
        className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-96 flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold text-cyan-400 text-center">
          ログイン
        </h2>

        <input
          type="email"
          placeholder="メールアドレス"
          className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-400 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="パスワード"
          className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-400 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorMsg && (
          <p className="text-red-400 text-sm">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-cyan-500 hover:scale-105 transition p-3 rounded-lg font-bold disabled:opacity-50"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>

        <p className="text-sm text-center">
          アカウントをお持ちでない方は{" "}
          <Link href="/account/signup" className="text-cyan-400">
            新規作成
          </Link>
        </p>
      </form>
    </div>
  )
}