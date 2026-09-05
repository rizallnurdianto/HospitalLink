import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { CheckCircle2, Mail, User } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { Alert, Button } from "../../components/ui"
import { AuthShell, Field, GoogleAuthButton, PasswordField } from "./LoginPage"

export default function RegisterPage() {
  const { session, loading, signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [agree, setAgree] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)

  if (!loading && session) return <Navigate to="/setup-profile" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.")
      return
    }
    if (!agree) {
      setError("Setujui Syarat & Ketentuan untuk melanjutkan.")
      return
    }
    setBusy(true)
    try {
      const { needsEmailConfirmation } = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      })
      if (needsEmailConfirmation) {
        setConfirmSent(true)
      } else {
        navigate("/setup-profile", { replace: true })
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (confirmSent) {
    return (
      <AuthShell
        title="Cek email Anda"
        subtitle="Satu langkah lagi untuk menyelesaikan pendaftaran."
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success-light text-success">
            <CheckCircle2 size={22} />
          </span>
          <p className="text-sm text-muted">
            Kami mengirim tautan verifikasi ke{" "}
            <span className="font-semibold text-foreground">
              {email.trim()}
            </span>
            . Buka tautan itu, lalu masuk untuk melengkapi profil Anda.
          </p>
          <Button to="/login" block size="lg" className="mt-1">
            Ke halaman masuk
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Daftar ke HospitalLink"
      subtitle="Buat akun gratis untuk melanjutkan."
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field icon={<User size={15} />} label="Nama Lengkap">
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nama Anda"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
          />
        </Field>
        <Field icon={<Mail size={15} />} label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
          />
        </Field>
        <PasswordField
          value={password}
          onChange={setPassword}
          placeholder="Minimal 6 karakter"
        />

        <div className="flex items-start gap-2.5 text-[12px] leading-relaxed text-muted">
          <input
            id="agree"
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-[1.5px] border-border accent-primary"
          />
          <label htmlFor="agree" className="cursor-pointer select-none">
            Saya setuju dengan{" "}
            <Link
              to="/syarat-ketentuan"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
            >
              Syarat &amp; Ketentuan
            </Link>{" "}
            dan{" "}
            <Link
              to="/kebijakan-privasi"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
            >
              Kebijakan Privasi
            </Link>{" "}
            HospitalLink
          </label>
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" block size="lg" loading={busy} className="mt-1">
          Daftar
        </Button>
      </form>

      <GoogleAuthButton label="Daftar dengan Google" />

      <p className="mt-5 text-center text-xs text-muted">
        Sudah punya akun?{" "}
        <Link
          to="/login"
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </AuthShell>
  )
}
