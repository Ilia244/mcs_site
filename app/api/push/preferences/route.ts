import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { DEFAULT_NOTIFICATION_PREFERENCES, isNotificationTypeKey, NOTIFICATION_TYPES } from "@/lib/notification-settings"

export const runtime = "nodejs"

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { data: { user } } = await client.auth.getUser(auth.slice(7))
  return user || null
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    const { data, error } = await admin()
      .from("notification_preferences")
      .select("category,enabled")
      .eq("user_id", user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const preferences = { ...DEFAULT_NOTIFICATION_PREFERENCES }
    for (const row of data || []) {
      if (isNotificationTypeKey(row.category)) preferences[row.category] = row.enabled !== false
    }
    return NextResponse.json({ preferences })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const input = body?.preferences
    if (!input || typeof input !== "object") {
      return NextResponse.json({ error: "preferencesが不正です" }, { status: 400 })
    }

    const rows = NOTIFICATION_TYPES.map(type => ({
      user_id: user.id,
      category: type.key,
      enabled: input[type.key] !== false,
      updated_at: new Date().toISOString(),
    }))
    const { error } = await admin().from("notification_preferences").upsert(rows, { onConflict: "user_id,category" })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 })
  }
}
