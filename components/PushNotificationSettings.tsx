"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/providers/AuthProvider"
import { DEFAULT_NOTIFICATION_PREFERENCES, NOTIFICATION_TYPES, NotificationTypeKey } from "@/lib/notification-settings"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

type Props = { compact?: boolean }

export default function PushNotificationSettings({ compact = false }: Props) {
  const { user, accessToken } = useAuth()
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default")
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [message, setMessage] = useState("")
  const [preferences, setPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [testing, setTesting] = useState(false)

  const loadPreferences = async () => {
    if (!accessToken) return
    try {
      const r = await fetch("/api/push/preferences", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      })
      if (!r.ok) return
      const j = await r.json()
      if (j.preferences) setPreferences({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...j.preferences })
    } catch (e) {
      console.error(e)
    }
  }

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
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {})
    void navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => setEnabled(!!sub))
    void loadPreferences()
  }, [supported, user, accessToken])

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
      const existing = await registration.pushManager.getSubscription()
      const subscription = existing || await registration.pushManager.subscribe({
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

  const sendTest = async () => {
    if (!accessToken) return
    setTesting(true)
    setMessage("")
    try {
      const r = await fetch("/api/push/test", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) {
        const detail = j?.errors?.[0] || j?.error || `送信失敗 (${r.status})`
        throw new Error(`${detail} / 送信=${j?.sent ?? 0}, 失敗=${j?.failed ?? 0}, 登録=${(j?.sent ?? 0) + (j?.failed ?? 0) + (j?.removed ?? 0)}`)
      }
      setMessage(`テスト通知を送信しました（送信 ${j.sent}件）。`)
    } catch (e: any) {
      console.error(e)
      setMessage(e?.message || "テスト通知の送信に失敗しました。")
    } finally {
      setTesting(false)
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

  const savePreferences = async (next: typeof preferences) => {
    if (!accessToken) return
    setPreferences(next)
    setSavingPrefs(true)
    setMessage("")
    try {
      const r = await fetch("/api/push/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ preferences: next }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || "通知設定の保存に失敗しました。")
      setMessage("通知の種類を保存しました。")
    } catch (e: any) {
      setMessage(e?.message || "通知設定の保存に失敗しました。")
    } finally {
      setSavingPrefs(false)
    }
  }

  if (!user) return null

  if (compact) {
    return (
      <div className="push-settings-compact relative rounded-xl border border-white/15 bg-slate-950/98 shadow-lg shadow-black/30 p-1">
        <button
          type="button"
          onClick={() => setSettingsOpen(value => !value)}
          className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left bg-slate-900/90 hover:bg-slate-800/90 transition"
          aria-expanded={settingsOpen}
        >
          <span className="flex items-center gap-2 min-w-0">
            <span aria-hidden="true">⚙️</span>
            <span className="font-semibold text-sm truncate">通知設定</span>
          </span>
          <span className="text-xs text-gray-400 shrink-0">{settingsOpen ? "▲ 閉じる" : "▼ 開く"}</span>
        </button>

        {settingsOpen && (
          <div className="absolute top-full right-0 mt-2 z-[60] w-72 max-w-[calc(100vw-3rem)] rounded-xl border border-white/15 bg-slate-950 p-3 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">プッシュ通知</div>
                <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                  {enabled ? "この端末で通知を受け取ります" : "この端末では通知しません"}
                </div>
              </div>
              {supported && permission !== "denied" && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={enabled ? disable : enable}
                    className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15 disabled:opacity-50 text-xs font-semibold"
                  >
                    {busy ? "処理中…" : enabled ? "通知OFF" : "通知ON"}
                  </button>
                  {enabled && <button type="button" disabled={testing} onClick={() => void sendTest()} className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 hover:bg-cyan-500/15 disabled:opacity-50 text-xs font-semibold">{testing ? "送信中…" : "テスト"}</button>}
                </div>
              )}
            </div>

            {!supported && <p className="text-[11px] text-amber-300">このブラウザではWeb Push通知を利用できません。</p>}
            {permission === "denied" && <p className="text-[11px] text-amber-300">ブラウザ側で通知が拒否されています。ブラウザのサイト設定から通知を許可してください。</p>}

            {enabled && (
              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-xs font-bold">通知する種類</div>
                  <button
                    type="button"
                    disabled={savingPrefs}
                    onClick={() => {
                      const next = { ...preferences } as typeof preferences
                      for (const type of NOTIFICATION_TYPES) next[type.key] = true
                      void savePreferences(next)
                    }}
                    className="text-[11px] text-cyan-300 disabled:opacity-50 shrink-0"
                  >
                    すべてON
                  </button>
                </div>
                <div className="space-y-0.5">
                  {NOTIFICATION_TYPES.map(type => {
                    const key = type.key as NotificationTypeKey
                    return (
                      <label key={key} className="flex items-center justify-between gap-3 py-2 cursor-pointer min-w-0">
                        <span className="min-w-0 pr-2">
                          <span className="text-xs block truncate">{type.label}</span>
                          <span className="text-[10px] text-gray-500 block truncate">{type.description}</span>
                        </span>
                        <input
                          type="checkbox"
                          className="shrink-0"
                          checked={preferences[key]}
                          disabled={savingPrefs}
                          onChange={e => void savePreferences({ ...preferences, [key]: e.target.checked })}
                        />
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {message && <p className="text-[11px] text-cyan-300 mt-2 break-words">{message}</p>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-bold text-lg">🔔 プッシュ通知</h2>
          <p className="text-sm text-gray-400 mt-1">新着動画・LIVE・お知らせを端末の通知として受け取ります。</p>
        </div>
        {supported && permission !== "denied" && (
          <div className="flex items-center gap-2">
            <button type="button" disabled={busy} onClick={enabled ? disable : enable}
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 disabled:opacity-50 text-xs font-semibold">
              {busy ? "処理中…" : enabled ? "通知をOFF" : "通知をON"}
            </button>
            {enabled && <button type="button" disabled={testing} onClick={() => void sendTest()} className="px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 hover:bg-cyan-500/15 disabled:opacity-50 text-xs font-semibold">{testing ? "送信中…" : "テスト通知"}</button>}
          </div>
        )}
      </div>
      {!supported && <p className="text-xs text-amber-300 mt-2">このブラウザではWeb Push通知を利用できません。</p>}
      {permission === "denied" && <p className="text-xs text-amber-300 mt-2">ブラウザ側で通知が拒否されています。ブラウザのサイト設定から通知を許可してください。</p>}
      {enabled && (
        <div className="mt-3 rounded-xl bg-black/20 border border-white/10 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-xs font-bold">通知する種類</div>
            <button type="button" disabled={savingPrefs} onClick={() => {
              const next = { ...preferences } as typeof preferences
              for (const type of NOTIFICATION_TYPES) next[type.key] = true
              void savePreferences(next)
            }} className="text-[11px] text-cyan-300 disabled:opacity-50">すべてON</button>
          </div>
          <div className="space-y-1">
            {NOTIFICATION_TYPES.map(type => {
              const key = type.key as NotificationTypeKey
              return <label key={key} className="flex items-center justify-between gap-3 py-1.5 cursor-pointer">
                <span className="min-w-0"><span className="text-xs block">{type.label}</span><span className="text-[10px] text-gray-500">{type.description}</span></span>
                <input type="checkbox" checked={preferences[key]} disabled={savingPrefs}
                  onChange={e => void savePreferences({ ...preferences, [key]: e.target.checked })} />
              </label>
            })}
          </div>
        </div>
      )}
      {message && <p className="text-xs text-cyan-300 mt-2 break-words">{message}</p>}
    </div>
  )
}
