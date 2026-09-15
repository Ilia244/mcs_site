import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 30

const withTimeout = <T>(promise: PromiseLike<T>, ms = 10000, message = "処理がタイムアウトしました"): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    Promise.resolve(promise).then(
      (value) => { clearTimeout(timer); resolve(value) },
      (error) => { clearTimeout(timer); reject(error) },
    )
  })

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

async function authorize(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  const token = auth.slice(7)
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { data: { user }, error } = await withTimeout(client.auth.getUser(token), 8000)
  if (error || !user) return null
  const { data: profile, error: profileError } = await withTimeout(admin()
    .from("profiles").select("role,is_admin").eq("id", user.id).maybeSingle(), 8000)
  if (profileError) throw new Error(profileError.message)
  if (profile?.role !== "owner" && profile?.role !== "admin" && !profile?.is_admin) return null
  return user
}

function cleanChannel(body: any) {
  const handle = String(body.handle ?? "").trim()
  const channelId = String(body.channel_id ?? "").trim()
  const channelUrl = String(body.channel_url ?? "").trim()
  return {
    display_name: String(body.display_name ?? "").trim(),
    handle: handle || null,
    channel_id: channelId || null,
    channel_url: channelUrl || (handle ? `https://www.youtube.com/${handle.startsWith("@") ? handle : `@${handle}`}` : channelId ? `https://www.youtube.com/channel/${channelId}` : "https://www.youtube.com/"),
    channel_role: ["owner", "staff", "community"].includes(body.channel_role) ? body.channel_role : "staff",
    enabled: body.enabled !== false,
    show_home: body.show_home !== false,
    show_mcs: body.show_mcs !== false,
    show_live: body.show_live !== false,
    show_videos: body.show_videos !== false,
    auto_post: body.auto_post !== false,
    auto_notify: body.auto_notify !== false,
    auto_post_mode: body.auto_post_mode === "draft" ? "draft" : "published",
    sort_order: Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 100,
    updated_at: new Date().toISOString(),
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 500 })
    if (!await authorize(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    const payload = cleanChannel(await req.json())
    if (!payload.display_name) return NextResponse.json({ error: "表示名を入力してください" }, { status: 400 })
    const { data, error } = await withTimeout(admin().from("youtube_channels").insert(payload).select("*").single(), 10000)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, channel: data })
  } catch (e: any) { return NextResponse.json({ error: e?.message || "server error" }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 500 })
    if (!await authorize(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: "チャンネルIDがありません" }, { status: 400 })
    const payload = cleanChannel(body)
    if (!payload.display_name) return NextResponse.json({ error: "表示名を入力してください" }, { status: 400 })
    const { data, error } = await withTimeout(admin().from("youtube_channels").update(payload).eq("id", body.id).select("*").single(), 10000)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, channel: data })
  } catch (e: any) { return NextResponse.json({ error: e?.message || "server error" }, { status: 500 }) }
}
