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

    const { notificationId } = await req.json()
    if (!notificationId) return NextResponse.json({ error: "notificationIdがありません" }, { status: 400 })

    const result = await sendPushForNotification(String(notificationId))
    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 })
  }
}
