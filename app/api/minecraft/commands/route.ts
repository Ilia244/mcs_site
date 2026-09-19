import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { getRoleLevel } from "@/lib/role"

export type MinecraftCommand = {
  id: string
  category: string
  command: string
  aliases: string[]
  name: string
  description: string
  permission: string
  target: string
  notes: string
  sort_order: number
  enabled: boolean
  required_role: string
}

const DEFAULT_COMMANDS: MinecraftCommand[] = [
  { id: "tpa", category: "一般", aliases: [], command: "/tpa <player>", name: "テレポート申請", description: "指定したプレイヤーへテレポート申請を送ります。", permission: "essentials.tpa", target: "EssentialsX", notes: "", sort_order: 1, enabled: true, required_role: "user" },
  { id: "tpaccept", category: "一般", aliases: [], command: "/tpaccept", name: "テレポート許可", description: "届いているテレポート申請を許可します。", permission: "essentials.tpaccept", target: "EssentialsX", notes: "", sort_order: 2, enabled: true, required_role: "user" },
  { id: "tpdeny", category: "一般", aliases: [], command: "/tpdeny", name: "テレポート拒否", description: "届いているテレポート申請を拒否します。", permission: "essentials.tpdeny", target: "EssentialsX", notes: "", sort_order: 3, enabled: true, required_role: "user" },
  { id: "hat", category: "一般", aliases: [], command: "/hat", name: "帽子", description: "手に持っているアイテムを頭に装備します。", permission: "essentials.hat", target: "EssentialsX", notes: "", sort_order: 4, enabled: true, required_role: "user" },
  { id: "sit", category: "一般", aliases: [], command: "/sit", name: "座る", description: "その場に座ります。", permission: "", target: "プラグイン", notes: "", sort_order: 5, enabled: true, required_role: "user" },
  { id: "tp", category: "プレイヤー管理", aliases: [], command: "/tp <player>", name: "テレポート", description: "指定したプレイヤーの場所へ移動します。", permission: "", target: "Minecraft", notes: "", sort_order: 10, enabled: true, required_role: "moderator" },
  { id: "gamemode", category: "プレイヤー管理", aliases: [], command: "/gamemode <mode> [player]", name: "ゲームモード変更", description: "自分または指定したプレイヤーのゲームモードを変更します。", permission: "", target: "Minecraft", notes: "", sort_order: 20, enabled: true, required_role: "staff" },
  { id: "kick", category: "プレイヤー管理", aliases: [], command: "/kick <player>", name: "キック", description: "指定したプレイヤーをサーバーから退出させます。", permission: "", target: "Minecraft / Spigot", notes: "", sort_order: 30, enabled: true, required_role: "staff" },
  { id: "vanish", category: "運営モード", command: "/vanish", aliases: ["/ivanish", "/evanish"], name: "Vanish", description: "自分をVanish状態にします。", permission: "", target: "MCS Plugin", notes: "", sort_order: 40, enabled: true, required_role: "moderator" },
  { id: "lp-user", category: "権限管理", aliases: [], command: "/lp user <player> parent set <group>", name: "LuckPermsグループ変更", description: "指定プレイヤーのLuckPermsグループを変更します。", permission: "luckperms.user.parent.set", target: "LuckPerms", notes: "対象プレイヤーと変更先グループを確認してから実行してください。", sort_order: 50, enabled: true, required_role: "admin" },
  { id: "co-inspect", category: "調査", aliases: [], command: "/co inspect", name: "CoreProtect調査", description: "ブロックの設置・破壊などの履歴を確認する調査モードを切り替えます。", permission: "coreprotect.inspect", target: "CoreProtect", notes: "", sort_order: 60, enabled: true, required_role: "staff" },
]

async function getSessionProfile(request: Request) {
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
  return { user, role, level: getRoleLevel(role) }
}

async function authenticateRead(request: Request) {
  const session = await getSessionProfile(request)
  return session && session.level >= 10 ? session : null
}

async function authenticateManage(request: Request) {
  const session = await getSessionProfile(request)
  return session && session.level >= 80 ? session : null
}

const COMMAND_ROLES = new Set(["user", "moderator", "staff", "admin", "owner"])

function normalizeRequiredRole(value: unknown) {
  const role = String(value || "user").trim()
  return COMMAND_ROLES.has(role) ? role : "user"
}

function normalize(value: unknown): MinecraftCommand[] {
  const source = Array.isArray(value) ? value : DEFAULT_COMMANDS
  const normalized = source
    .map((item: any, index): MinecraftCommand => ({
      id: String(item.id || `command-${index + 1}`).trim(),
      category: String(item.category || "その他").trim(),
      command: String(item.command || "").trim(),
      aliases: Array.isArray(item.aliases) ? item.aliases.map((alias: unknown) => String(alias).trim()).filter(Boolean) : [],
      name: String(item.name || "コマンド").trim(),
      description: String(item.description || "").trim(),
      permission: String(item.permission || "").trim(),
      target: String(item.target || "Minecraft").trim(),
      notes: String(item.notes || "").trim(),
      sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : (index + 1) * 10,
      enabled: item.enabled !== false,
      required_role: normalizeRequiredRole(item.required_role),
    }))
    .filter((item) => item.id && item.command)

  // Treat multiple commands that perform the same Vanish action as one
  // command group. This also migrates older settings that stored /ivanish
  // and /evanish as separate entries.
  const vanishItems = normalized.filter((item) =>
    ["/vanish", "/ivanish", "/evanish"].includes(item.command.toLowerCase())
    || item.id.toLowerCase() === "vanish"
    || item.id.toLowerCase() === "ivanish"
    || item.id.toLowerCase() === "evanish"
  )
  if (vanishItems.length > 0) {
    const main = vanishItems.find((item) => item.command.toLowerCase() === "/vanish" || item.id.toLowerCase() === "vanish") ?? vanishItems[0]
    const aliases = new Set<string>(["/ivanish", "/evanish"])
    for (const item of vanishItems) {
      for (const alias of item.aliases) aliases.add(alias)
      if (item.command.toLowerCase() !== "/vanish") aliases.add(item.command)
    }
    main.id = "vanish"
    main.command = "/vanish"
    main.aliases = Array.from(aliases).filter((alias) => alias !== "/vanish")
    main.name = main.name || "Vanish"
    main.description = main.description || "自分をVanish状態にします。"
    main.category = main.category || "運営モード"
    main.required_role = vanishItems.reduce((highest, item) =>
      getRoleLevel(item.required_role) > getRoleLevel(highest) ? item.required_role : highest, main.required_role)
  }

  const withoutVanishDuplicates = normalized.filter((item) => !vanishItems.includes(item) || item === vanishItems.find((candidate) => candidate.command.toLowerCase() === "/vanish" || candidate.id.toLowerCase() === "vanish"))
  return withoutVanishDuplicates
    .sort((a, b) => a.sort_order - b.sort_order)
}

export async function GET(request: Request) {
  const session = await authenticateRead(request)
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const { data, error } = await supabaseServer
    .from("site_settings")
    .select("value")
    .eq("key", "minecraft_commands")
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.value) {
    return NextResponse.json({
      commands: DEFAULT_COMMANDS.filter((item) => getRoleLevel(item.required_role) <= session.level),
    })
  }

  try {
    const stored = normalize(JSON.parse(data.value))
    // Add newly introduced default/general commands without overwriting
    // commands already customized by an administrator.
    const existingIds = new Set(stored.map((item) => item.id))
    const merged = [
      ...stored,
      ...DEFAULT_COMMANDS.filter((item) => !existingIds.has(item.id)),
    ].sort((a, b) => a.sort_order - b.sort_order)

    const commands = merged.filter((item) => getRoleLevel(item.required_role) <= session.level)
    return NextResponse.json({ commands })
  } catch {
    return NextResponse.json({
      commands: DEFAULT_COMMANDS.filter((item) => getRoleLevel(item.required_role) <= session.level),
    })
  }
}

export async function PUT(request: Request) {
  const session = await authenticateManage(request)
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const commands = normalize(body.commands)
  if (!commands.length) return NextResponse.json({ error: "コマンドを1件以上登録してください" }, { status: 400 })

  const { error } = await supabaseServer
    .from("site_settings")
    .upsert({ key: "minecraft_commands", value: JSON.stringify(commands), updated_at: new Date().toISOString() }, { onConflict: "key" })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, commands })
}
