"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/providers/AuthProvider"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

export default function PushNotificationSettings() {
  const { user, accessToken } = useAuth()
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default")
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const ok = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window
    setSupported(ok)
    if (ok) setPermission(Notification.permission)
  }, [])

  useEffect(() => {
    if (!supported || !user) {
      setEnabled(false)
      return
    }
    void navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription()).then(sub => {
      setEnabled(!!sub)
    })
  }, [supported, user])

  const enable = async () => {
    if (!user || !accessToken) {
      setMessage("通知を利用するにはログインしてください。")
      return
    }
    if (!supported) {
      setMessage("このブラウザはWeb Push通知に対応していません。")
      return
    }
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!publicKey) {
      setMessage("サイト側のWeb Push設定が未完了です。管理者に確認してください。")
      return
    }

    setBusy(true)
    setMessage("")
    try {
      const nextPermission = await Notification.requestPermission()
      setPermission(nextPermission)
      if (nextPermission !== "granted") {
        setMessage(nextPermission === "denied" ? "通知がブラウザで拒否されています。" : "通知は許可されませんでした。")
        return
      }

      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
      await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const r = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(subscription.toJSON()),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || "購読情報の保存に失敗しました。")

      setEnabled(true)
      setMessage("通知を有効にしました。")
    } catch (e: any) {
      console.error(e)
      setMessage(e?.message || "通知の有効化に失敗しました。")
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    if (!accessToken) return
    setBusy(true)
    setMessage("")
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }
      setEnabled(false)
      setMessage("この端末のサイト通知を解除しました。")
    } catch (e: any) {
      setMessage(e?.message || "通知解除に失敗しました。")
    } finally {
      setBusy(false)
    }
  }

  if (!user) return null

  return (
    <section className="w-full rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-lg">🔔 サイト通知</h2>
          <p className="text-sm text-gray-400 mt-1">新着動画・LIVE・重要なお知らせを端末の通知として受け取ります。</p>
        </div>
        {supported && permission !== "denied" && (
          <button type="button" disabled={busy} onClick={enabled ? disable : enable}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 disabled:opacity-50">
            {busy ? "処理中…" : enabled ? "通知をOFF" : "通知を許可"}
          </button>
        )}
      </div>
      {!supported && <p className="text-sm text-amber-300 mt-3">このブラウザではWeb Push通知を利用できません。</p>}
      {permission === "denied" && <p className="text-sm text-amber-300 mt-3">ブラウザ側で通知が拒否されています。ブラウザのサイト設定から通知を許可してください。</p>}
      {message && <p className="text-sm text-cyan-300 mt-3 break-words">{message}</p>}
    </section>
  )
}
