export const SITE_CONFIG = {
  name: "Ilia./衣李亜",
  subtitle: "Official Portal",
  youtube: "https://www.youtube.com/@Ilia244",
  discord: "https://discord.com/",
  dynmap: "",
  servers: [
    { id: "survival", name: "SURVIVAL", label: "サバイバル", description: "みんなで遊ぶメインサーバー", edition: "Java / Bedrock" },
    { id: "creative", name: "CREATIVE", label: "クリエイティブ", description: "建築・制作を楽しむサーバー", edition: "Java / Bedrock" },
    { id: "event", name: "EVENT", label: "イベント", description: "参加型企画・イベント用サーバー", edition: "Java / Bedrock" },
  ],
} as const

export const STREAM_CONFIG = {
  live: false,
  title: "みんなでサバイバル！",
  description: "視聴者参加型Minecraft配信を開催中！",
  participants: 0,
  capacity: 50,
  youtubeUrl: SITE_CONFIG.youtube,
  participationEnabled: true,
  nextStream: "次回配信日時はYouTubeで告知します。",
} as const

export const POST_TYPES = [
  { value: "info", label: "お知らせ", icon: "📢" },
  { value: "event", label: "イベント", icon: "🎉" },
  { value: "mcs", label: "MCS / Minecraft", icon: "🎮" },
  { value: "live", label: "配信", icon: "🔴" },
  { value: "youtube", label: "YouTube", icon: "▶️" },
  { value: "maintenance", label: "メンテナンス", icon: "🔧" },
  { value: "important", label: "重要なお知らせ", icon: "🚨" },
  { value: "community", label: "コミュニティ", icon: "💬" },
] as const
