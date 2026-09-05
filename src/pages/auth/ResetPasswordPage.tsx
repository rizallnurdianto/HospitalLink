import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { Alert, Button } from "../../components/ui"
import { AuthShell, PasswordField } from "./LoginPage"
import FullscreenLoader from "../../components/common/FullscreenLoader"

/**
 * Halaman tujuan link email "Reset Password". supabase-js mengubah token di
 * URL menjadi recovery session (via `detectSessionInUrl`); begitu session itu
 * siap kita tampilkan form kata sandi baru, lalu sign-out dan arahkan ke /login.
 */
export default function ResetPasswordPage() {
  const { session, loading, updatePassword, signOut } = useAuth()
  const navigate = useNavigate()
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  // Supabase mengarahkan ke sini dengan error jika tautan kedaluwarsa / sudah dipakai.
  const params = new URLSearchParams(
    window.location.search + window.location.hash.replace(/^#/, "&"),
  )
  const linkError = params.get("error_description") ?? params.get("error")

  useEffect(() => {
    if (linkError) return
    const t = setTimeout(() => setTimedOut(true), 12000)
    return () => clearTimeout(t)
  }, [linkError])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (pw.length < 6) {
      setError("Kata sandi minimal 6 karakter.")
      return
    }
    if (pw !== pw2) {
      setError("Konfirmasi kata sandi tidak cocok.")
      return
    }
    setBusy(true)
    try {
      await updatePassword(pw)
      await signOut()
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  if (done) {
    return (
      <AuthShell
        title="Kata sandi diperbarui"
        subtitle="Masuk dengan kata sandi baru Anda."
        backTo={null}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success-light text-success">
            <CheckCircle2 size={22} />
          </span>
          <p className="text-sm text-muted">
            Kata sandi berhasil diubah. Gunakan yang baru untuk masuk ke akun
            Anda.
          </p>
          <Button
            onClick={() => navigate("/login", { replace: true })}
            block
            size="lg"
            className="mt-1"
          >
            Ke halaman masuk
          </Button>
        </div>
      </AuthShell>
    )
  }

  if (linkError || timedOut || (!loading && !session)) {
    return (
      <AuthShell
        title="Tautan tidak valid"
        subtitle="Tautan atur ulang kata sandi sudah kedaluwarsa atau telah dipakai."
        backTo="/login"
        backLabel="Kembali ke halaman masuk"
      >
        <Button to="/lupa-password" block size="lg">
          Minta tautan baru
        </Button>
      </AuthShell>
    )
  }

  if (loading || !session) return <FullscreenLoader />

  return (
    <AuthShell
      title="Buat kata sandi baru"
      subtitle="Masukkan kata sandi baru untuk akun Anda."
      backTo={null}
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <PasswordField
          value={pw}
          onChange={setPw}
          label="Kata Sandi Baru"
          placeholder="Minimal 6 karakter"
        />
        <PasswordField
          value={pw2}
          onChange={setPw2}
          label="Ulangi Kata Sandi"
          placeholder="Ketik ulang kata sandi"
        />

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" block size="lg" loading={busy} className="mt-1">
          Simpan Kata Sandi
        </Button>
      </form>
    </AuthShell>
  )
}
