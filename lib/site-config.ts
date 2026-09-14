export const SITE_CONFIG = {
  name: "IRyiaServer",
  subtitle: "Minecraft Community Portal",
  youtube: "https://www.youtube.com/@YOUR_CHANNEL",
  discord: "https://discord.com/",
  dynmap: "",
  servers: [
    {
      id: "survival",
      name: "SURVIVAL",
      label: "サバイバル",
      description: "みんなで遊ぶメインサーバー",
      edition: "Java / Bedrock",
    },
    {
      id: "creative",
      name: "CREATIVE",
      label: "クリエイティブ",
      description: "建築・制作を楽しむサーバー",
      edition: "Java / Bedrock",
    },
    {
      id: "event",
      name: "EVENT",
      label: "イベント",
      description: "参加型企画・イベント用サーバー",
      edition: "Java / Bedrock",
    },
  ],
} as const

// 配信中の表示は、現在はここを変更して運用できます。
// 将来的に Supabase / Minecraft API と接続して自動化できます。
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
