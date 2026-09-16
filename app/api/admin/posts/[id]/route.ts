import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = req.headers.get("authorization")
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const { data: { user } } = await anon.auth.getUser(auth.slice(7))
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const { data: profile } = await db.from("profiles").select("role,is_admin").eq("id", user.id).maybeSingle()
    if (!profile || (profile.role !== "owner" && profile.role !== "admin" && !profile.is_admin)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const { id } = await params
    if (!id) return NextResponse.json({ error: "post id is required" }, { status: 400 })

    // Delete dependent rows first so old schemas without ON DELETE CASCADE are also safe.
    const notifications = await db.from("notifications").select("id").eq("post_id", id)
    if (notifications.error) return NextResponse.json({ error: notifications.error.message }, { status: 500 })
    const notificationIds = (notifications.data || []).map((n: { id: string }) => n.id)

    if (notificationIds.length) {
      const readRows = await db.from("user_notifications").delete().in("notification_id", notificationIds)
      if (readRows.error) return NextResponse.json({ error: `通知既読情報の削除に失敗しました: ${readRows.error.message}` }, { status: 500 })
      const deletedNotifications = await db.from("notifications").delete().eq("post_id", id)
      if (deletedNotifications.error) return NextResponse.json({ error: `通知の削除に失敗しました: ${deletedNotifications.error.message}` }, { status: 500 })
    }

    const deletedPost = await db.from("posts").delete().eq("id", id)
    if (deletedPost.error) return NextResponse.json({ error: deletedPost.error.message }, { status: 500 })

    return NextResponse.json({ ok: true, deletedNotifications: notificationIds.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 })
  }
}
