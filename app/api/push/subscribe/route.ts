import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const body = await req.json()
    const endpoint = String(body?.endpoint || "").trim()
    const p256dh = String(body?.keys?.p256dh || "").trim()
    const auth = String(body?.keys?.auth || "").trim()

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Push購読情報が不正です" }, { status: 400 })
    }

    const { error } = await admin().from("push_subscriptions").upsert(
      { user_id: user.id, endpoint, p256dh, auth, updated_at: new Date().toISOString() },
      { onConflict: "endpoint" },
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const endpoint = String(body?.endpoint || "").trim()
    if (!endpoint) return NextResponse.json({ error: "endpointがありません" }, { status: 400 })

    const { error } = await admin().from("push_subscriptions").delete()
      .eq("user_id", user.id).eq("endpoint", endpoint)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 })
  }
}
