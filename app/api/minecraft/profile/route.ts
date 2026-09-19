import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

const MCID_RE = /^[A-Za-z0-9_]{3,16}$/

async function getUserFromRequest(request: Request) {
  const auth = request.headers.get("authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : ""
  if (!token) return null
  const { data, error } = await supabaseServer.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

async function lookupByName(name: string) {
  const response = await fetch(
    `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`,
    { cache: "no-store" },
  )
  if (response.status === 204 || response.status === 404) return null
  if (!response.ok) throw new Error(`Mojang API error: ${response.status}`)
  return (await response.json()) as { id: string; name: string }
}

async function lookupByUuid(uuid: string) {
  const normalized = uuid.replace(/-/g, "")
  const response = await fetch(
    `https://sessionserver.mojang.com/session/minecraft/profile/${encodeURIComponent(normalized)}`,
    { cache: "no-store" },
  )
  if (response.status === 204 || response.status === 404) return null
  if (!response.ok) throw new Error(`Mojang session API error: ${response.status}`)
  return (await response.json()) as { id: string; name: string }
}

function formatUuid(id: string) {
  const raw = id.replace(/-/g, "")
  if (raw.length !== 32) return id
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`
}

async function syncForUser(userId: string, requestedName?: string) {
  const { data: profile, error: profileError } = await supabaseServer
    .from("profiles")
    .select("minecraft_id,minecraft_uuid")
    .eq("id", userId)
    .maybeSingle()

  if (profileError) throw profileError

  const currentName = String(requestedName || profile?.minecraft_id || "").trim()
  let minecraft: { id: string; name: string } | null = null

  if (profile?.minecraft_uuid) {
    minecraft = await lookupByUuid(profile.minecraft_uuid)
    if (!minecraft && currentName) minecraft = await lookupByName(currentName)
  } else if (currentName) {
    minecraft = await lookupByName(currentName)
  }

  if (!minecraft) {
    throw new Error("Minecraftアカウントが見つかりません。MCIDを確認してください。")
  }

  const uuid = formatUuid(minecraft.id)
  const { data: owner } = await supabaseServer
    .from("profiles")
    .select("id")
    .eq("minecraft_uuid", uuid)
    .neq("id", userId)
    .maybeSingle()

  if (owner) throw new Error("このMinecraftアカウントは別のWebアカウントに登録されています。")

  const { error: updateError } = await supabaseServer
    .from("profiles")
    .update({
      minecraft_id: minecraft.name,
      minecraft_uuid: uuid,
      minecraft_last_checked: new Date().toISOString(),
    })
    .eq("id", userId)

  if (updateError) throw updateError

  return { minecraft_id: minecraft.name, minecraft_uuid: uuid, changed: profile?.minecraft_id !== minecraft.name || profile?.minecraft_uuid !== uuid }
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const minecraftId = String(body.minecraftId || "").trim()
  if (!MCID_RE.test(minecraftId)) {
    return NextResponse.json({ error: "Minecraft IDは3〜16文字の英数字または_で入力してください。" }, { status: 400 })
  }

  try {
    return NextResponse.json(await syncForUser(user.id, minecraftId))
  } catch (error: any) {
    console.error("Minecraft account registration error", error)
    return NextResponse.json({ error: error?.message || "Minecraftアカウントの登録に失敗しました。" }, { status: 400 })
  }
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { data: profile, error } = await supabaseServer
    .from("profiles")
    .select("minecraft_id,minecraft_uuid")
    .eq("id", user.id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!profile?.minecraft_id && !profile?.minecraft_uuid) return NextResponse.json({ linked: false })

  try {
    const result = await syncForUser(user.id)
    return NextResponse.json({ linked: true, ...result })
  } catch (error: any) {
    // Do not erase a valid saved link when Mojang is temporarily unavailable.
    console.error("Minecraft account sync error", error)
    return NextResponse.json({
      linked: true,
      minecraft_id: profile.minecraft_id,
      minecraft_uuid: profile.minecraft_uuid,
      synced: false,
      warning: "Minecraftプロフィールの自動確認に失敗しました。保存済み情報は維持しています。",
    })
  }
}


export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { error } = await supabaseServer
    .from("profiles")
    .update({
      minecraft_id: null,
      minecraft_uuid: null,
      minecraft_last_checked: null,
    })
    .eq("id", user.id)

  if (error) {
    console.error("Minecraft account unlink error", error)
    return NextResponse.json({ error: "Minecraftアカウントの連携解除に失敗しました。" }, { status: 500 })
  }

  return NextResponse.json({ linked: false })
}
