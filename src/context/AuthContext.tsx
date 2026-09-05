import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"
import type { Profile } from "../types/db"

type SignUpArgs = {
  email: string
  password: string
  fullName: string
}

type SignUpResult = {
  /** True bila proyek Supabase mengaktifkan "Confirm email" dan belum ada
   *  session yang terbit; pengguna harus klik tautan di email dulu sebelum bisa masuk. */
  needsEmailConfirmation: boolean
}

type AuthValue = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (args: SignUpArgs) => Promise<SignUpResult>
  signInWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()
      if (error) {
        console.error("Gagal memuat profil:", error.message)
        return null
      }
      return data as Profile | null
    },
    [],
  )

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session) {
        const p = await loadProfile(data.session.user.id)
        if (!active) return
        if (p && !p.is_active) {
          await supabase.auth.signOut()
          setSession(null)
          setProfile(null)
        } else {
          setProfile(p)
        }
      }
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, next) => {
        if (!active) return
        setSession(next)
        if (next) {
          const p = await loadProfile(next.user.id)
          if (!active) return
          if (p && !p.is_active) {
            await supabase.auth.signOut()
            setSession(null)
            setProfile(null)
            return
          }
          setProfile(p)
        } else {
          setProfile(null)
        }
      },
    )

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw new Error(translateAuthError(error.message))
  }, [])

  const signUp = useCallback(
    async ({
      email,
      password,
      fullName,
    }: SignUpArgs): Promise<SignUpResult> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw new Error(translateAuthError(error.message))
      return { needsEmailConfirmation: !data.session }
    },
    [],
  )

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    })
    if (error) throw new Error(translateAuthError(error.message))
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw new Error(translateAuthError(error.message))
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(translateAuthError(error.message))
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session) setProfile(await loadProfile(session.user.id))
  }, [session, loadProfile])

  const value = useMemo<AuthValue>(
    () => ({
      session,
      profile,
      loading,
      isAdmin: profile?.role === "admin",
      signIn,
      signUp,
      signInWithGoogle,
      resetPassword,
      updatePassword,
      signOut,
      refreshProfile,
    }),
    [
      session,
      profile,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      resetPassword,
      updatePassword,
      signOut,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>")
  return ctx
}

function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials"))
    return "Email atau kata sandi salah."
  if (m.includes("already registered")) return "Email ini sudah terdaftar."
  if (m.includes("password should be at least"))
    return "Kata sandi minimal 6 karakter."
  if (m.includes("unable to validate email")) return "Format email tidak valid."
  if (
    m.includes("token has expired") ||
    m.includes("otp_expired") ||
    m.includes("invalid or has expired")
  )
    return "Tautan sudah kedaluwarsa atau tidak valid. Minta tautan baru."
  if (
    m.includes("new password should be different") ||
    m.includes("different from the old password")
  )
    return "Kata sandi baru harus berbeda dari yang lama."
  if (m.includes("email not confirmed"))
    return "Email belum diverifikasi. Cek kotak masuk untuk tautan konfirmasi."
  if (m.includes("email rate limit exceeded") || m.includes("rate limit"))
    return 'Batas pengiriman email tercapai. Tunggu sekitar 1 jam lalu coba lagi, atau matikan "Confirm email" di Supabase (Authentication › Providers › Email) agar pendaftaran tidak mengirim email.'
  if (m.includes("for security purposes"))
    return "Terlalu cepat mencoba lagi. Tunggu sebentar lalu ulangi."
  return message
}
