export const NOTIFICATION_TYPES = [
  { key: "info", label: "一般のお知らせ", description: "通常のお知らせ" },
  { key: "mcs", label: "MCS", description: "Minecraftサーバー関連" },
  { key: "event", label: "イベント", description: "イベント・参加募集" },
  { key: "live", label: "LIVE / 配信", description: "配信開始・LIVE関連" },
  { key: "maintenance", label: "メンテナンス", description: "メンテナンス情報" },
  { key: "important", label: "重要なお知らせ", description: "重要・緊急のお知らせ" },
  { key: "youtube", label: "YouTube新着", description: "YouTube動画の公開" },
] as const

export type NotificationTypeKey = typeof NOTIFICATION_TYPES[number]["key"]

export const DEFAULT_NOTIFICATION_PREFERENCES: Record<NotificationTypeKey, boolean> =
  Object.fromEntries(NOTIFICATION_TYPES.map(type => [type.key, true])) as Record<NotificationTypeKey, boolean>

export function isNotificationTypeKey(value: string): value is NotificationTypeKey {
  return NOTIFICATION_TYPES.some(type => type.key === value)
}
