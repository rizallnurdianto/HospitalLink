import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { CheckCircle2, Mail } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { Alert, Button } from "../../components/ui"
import { AuthShell, Field } from "./LoginPage"

export default function ForgotPasswordPage() {
  const { session, loading, resetPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  if (!loading && session) return <Navigate to="/beranda" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await resetPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Cek email Anda"
        subtitle="Tautan untuk membuat kata sandi baru sudah dikirim."
        backTo="/login"
        backLabel="Kembali ke halaman masuk"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success-light text-success">
            <CheckCircle2 size={22} />
          </span>
          <p className="text-sm text-muted">
            Jika{" "}
            <span className="font-semibold text-foreground">
              {email.trim()}
            </span>{" "}
            terdaftar, kami sudah mengirim tautan untuk mengatur ulang kata
            sandi. Cek juga folder spam.
          </p>
          <Button to="/login" block size="lg" className="mt-1">
            Kembali ke halaman masuk
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Lupa kata sandi?"
      subtitle="Masukkan email Anda dan kami kirim tautan untuk membuat kata sandi baru."
      backTo="/login"
      backLabel="Kembali ke halaman masuk"
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5">
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

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" block size="lg" loading={busy} className="mt-1">
          Kirim tautan reset
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted">
        Ingat kata sandi Anda?{" "}
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
