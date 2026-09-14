export const ROLE_LEVEL = {
  owner: 100,
  admin: 80,
  staff: 60,
  moderator: 40,
  user: 10,
} as const

export type Role = keyof typeof ROLE_LEVEL

export function getRoleLevel(role?: string) {
  if (!role) return 0
  return ROLE_LEVEL[role as Role] ?? 0
}

export function hasPermission(role: string | undefined, requiredLevel: number) {
  return getRoleLevel(role) >= requiredLevel
}