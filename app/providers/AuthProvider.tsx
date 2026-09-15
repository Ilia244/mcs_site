"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export type Profile = {
  id: string
  displayName: string
  role: string
  is_admin: boolean
  created_at?: string
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  profileLoading: false,
  refreshProfile: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  const loadProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null)
      return
    }

    setProfileLoading(true)

    const { data, error } = await supabase
      .from("profiles")
      .select("id, displayName, role, is_admin, created_at")
      .eq("id", currentUser.id)
      .maybeSingle()

    if (error) {
      console.error("プロフィール取得エラー:", error)
      setProfile(null)
      setProfileLoading(false)
      return
    }

    if (!data) {
      // 通常はDB側のAuth triggerで作成されます。
      // 既存アカウントなどで存在しない場合だけ安全なRPCで救済します。
      const { error: ensureError } = await supabase.rpc("ensure_my_profile")

      if (ensureError) {
        console.error("プロフィール作成エラー:", ensureError)
        setProfile(null)
      } else {
        const { data: created, error: reloadError } = await supabase
          .from("profiles")
          .select("id, displayName, role, is_admin, created_at")
          .eq("id", currentUser.id)
          .maybeSingle()

        if (reloadError) {
          console.error("プロフィール再取得エラー:", reloadError)
          setProfile(null)
        } else {
          setProfile((created as Profile | null) ?? null)
        }
      }
    } else {
      setProfile(data as Profile)
    }

    setProfileLoading(false)
  }, [])

  const refreshProfile = useCallback(async () => {
    await loadProfile(user)
  }, [loadProfile, user])

  useEffect(() => {
    let active = true

    const initialize = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!active) return

      if (error) {
        console.error("セッション取得エラー:", error)
        setUser(null)
        setProfile(null)
      } else {
        const currentUser = data.session?.user ?? null
        setUser(currentUser)
        await loadProfile(currentUser)
      }

      if (active) setLoading(false)
    }

    void initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return

      const nextUser = session?.user ?? null
      setUser(nextUser)

      if (event === "SIGNED_OUT") {
        setProfile(null)
        return
      }

      // onAuthStateChangeのコールバック内でawaitはしない。
      void loadProfile(nextUser)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      profileLoading,
      refreshProfile,
    }),
    [user, profile, loading, profileLoading, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
