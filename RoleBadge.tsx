type Role = "owner" | "admin" | "staff" | "moderator"

interface RoleBadgeProps {
  role: string
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const roleMap: Record<string, {
    label: string
    gradient: string
    icon: string
  }> = {
    owner: {
      label: "OWNER",
      gradient: "from-yellow-400 via-amber-500 to-yellow-600",
      icon: "⚖️",
    },
    admin: {
      label: "ADMIN",
      gradient: "from-red-600 via-pink-600 to-red-600",
      icon: "👑",
    },
    staff: {
      label: "STAFF",
      gradient: "from-blue-500 via-cyan-500 to-blue-600",
      icon: "🛡️",
    },
    moderator: {
      label: "MOD",
      gradient: "from-green-500 via-emerald-500 to-green-600",
      icon: "🔧",
    },
  }

  if (!roleMap[role]) return null

  const { label, gradient, icon } = roleMap[role]

  return (
    <span
      className={`
        flex items-center gap-1
        px-2.5 py-0.5
        text-[10px] sm:text-xs
        font-semibold tracking-wider
        bg-gradient-to-r ${gradient}
        text-white
        rounded-full
        border border-white/20
        shadow-md
        backdrop-blur-sm
        whitespace-nowrap
      `}
    >
      <span className="text-[11px]">{icon}</span>
      {label}
    </span>
  )
}