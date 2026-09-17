import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendPushForNotification } from "@/lib/push-server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const { data: { user } } = await client.auth.getUser(auth.slice(7))
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const { data: profile } = await db.from("profiles").select("role,is_admin").eq("id", user.id).maybeSingle()
    if (profile?.role !== "owner" && profile?.role !== "admin" && !profile?.is_admin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const { data: notification, error } = await db.from("notifications").insert({
      category: "test",
      priority: "normal",
      title: "Web Push テスト通知",
      body: "MCS・Ilia. のWeb Push通知が正常に動作しています。",
      link_url: "/notifications",
    }).select("id").single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const result = await sendPushForNotification(notification.id)
    return NextResponse.json({ ok: result.sent > 0 && result.failed === 0, notificationId: notification.id, ...result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 })
  }
}
