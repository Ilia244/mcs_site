import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { getRoleLevel } from "@/lib/role"

export type MinecraftCommand = {
  id: string
  category: string
  command: string
  name: string
  description: string
  permission: string
  target: string
  notes: string
  sort_order: number
  enabled: boolean
}

const DEFAULT_COMMANDS: MinecraftCommand[] = [
  { id: "tp", category: "プレイヤー管理", command: "/tp <player>", name: "テレポート", description: "指定したプレイヤーの場所へ移動します。", permission: "", target: "Minecraft", notes: "", sort_order: 10, enabled: true },
  { id: "gamemode", category: "プレイヤー管理", command: "/gamemode <mode> [player]", name: "ゲームモード変更", description: "自分または指定したプレイヤーのゲームモードを変更します。", permission: "", target: "Minecraft", notes: "", sort_order: 20, enabled: true },
  { id: "kick", category: "プレイヤー管理", command: "/kick <player>", name: "キック", description: "指定したプレイヤーをサーバーから退出させます。", permission: "", target: "Minecraft / Spigot", notes: "", sort_order: 30, enabled: true },
  { id: "vanish", category: "運営モード", command: "/vanish", name: "Vanish", description: "自分をVanish状態にします。", permission: "", target: "MCS Plugin", notes: "", sort_order: 40, enabled: true },
  { id: "lp-user", category: "権限管理", command: "/lp user <player> parent set <group>", name: "LuckPermsグループ変更", description: "指定プレイヤーのLuckPermsグループを変更します。", permission: "luckperms.user.parent.set", target: "LuckPerms", notes: "対象プレイヤーと変更先グループを確認してから実行してください。", sort_order: 50, enabled: true },
  { id: "co-inspect", category: "調査", command: "/co inspect", name: "CoreProtect調査", description: "ブロックの設置・破壊などの履歴を確認する調査モードを切り替えます。", permission: "coreprotect.inspect", target: "CoreProtect", notes: "", sort_order: 60, enabled: true },
]

async function authenticate(request: Request) {
  const auth = request.headers.get("authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!token) return null
  const { data: { user } } = await supabaseServer.auth.getUser(token)
  if (!user) return null
  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("role,is_admin")
    .eq("id", user.id)
    .maybeSingle()
  const role = profile?.role || (profile?.is_admin ? "admin" : "user")
  return getRoleLevel(role) >= 60 ? user : null
}

function normalize(value: unknown): MinecraftCommand[] {
  const source = Array.isArray(value) ? value : DEFAULT_COMMANDS
  return source
    .map((item: any, index): MinecraftCommand => ({
      id: String(item.id || `command-${index + 1}`).trim(),
      category: String(item.category || "その他").trim(),
      command: String(item.command || "").trim(),
      name: String(item.name || "コマンド").trim(),
      description: String(item.description || "").trim(),
      permission: String(item.permission || "").trim(),
      target: String(item.target || "Minecraft").trim(),
      notes: String(item.notes || "").trim(),
      sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : (index + 1) * 10,
      enabled: item.enabled !== false,
    }))
    .filter((item) => item.id && item.command)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export async function GET(request: Request) {
  const user = await authenticate(request)
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const { data, error } = await supabaseServer
    .from("site_settings")
    .select("value")
    .eq("key", "minecraft_commands")
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.value) return NextResponse.json({ commands: DEFAULT_COMMANDS })

  try {
    return NextResponse.json({ commands: normalize(JSON.parse(data.value)) })
  } catch {
    return NextResponse.json({ commands: DEFAULT_COMMANDS })
  }
}

export async function PUT(request: Request) {
  const user = await authenticate(request)
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const commands = normalize(body.commands)
  if (!commands.length) return NextResponse.json({ error: "コマンドを1件以上登録してください" }, { status: 400 })

  const { error } = await supabaseServer
    .from("site_settings")
    .upsert({ key: "minecraft_commands", value: JSON.stringify(commands), updated_at: new Date().toISOString() }, { onConflict: "key" })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, commands })
}
